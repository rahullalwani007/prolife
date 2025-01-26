document.addEventListener('DOMContentLoaded', () => {
    // Check if page needs to scroll to top after reset
    if (localStorage.getItem('scrollToTop')) {
        // Use setTimeout to ensure the scroll happens after everything is loaded
        setTimeout(() => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            localStorage.removeItem('scrollToTop');
        }, 100);
    }
    
    // DOM Elements
    const modal = document.getElementById('emiModal');
    const incomeModal = document.getElementById('incomeModal');
    const addBtn = document.getElementById('addEMIBtn');
    const generateReportBtn = document.getElementById('generateReportBtn');
    const closeBtn = document.querySelector('.close-btn');
    const cancelBtn = document.querySelector('.cancel-btn');
    const form = document.getElementById('emiForm');
    const incomeForm = document.getElementById('incomeForm');
    const incomeCard = document.getElementById('incomeCard');
    const expertAdviceBtn = document.getElementById('expertAdviceBtn');
    const reportSection = document.getElementById('reportSection');

    // Load data from localStorage
    let emis = JSON.parse(localStorage.getItem('emis')) || [];
    let monthlyIncome = parseFloat(localStorage.getItem('monthlyIncome')) || 0;
    let incomeSource = localStorage.getItem('incomeSource') || 'Salary';

    // Income Card Click Handler
    incomeCard.addEventListener('click', () => {
        document.getElementById('newIncome').value = monthlyIncome;
        document.getElementById('incomeSource').value = incomeSource;
        incomeModal.classList.add('active');
    });

    // Income Form Handler
    incomeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        monthlyIncome = parseFloat(document.getElementById('newIncome').value);
        incomeSource = document.getElementById('incomeSource').value;
        
        localStorage.setItem('monthlyIncome', monthlyIncome);
        localStorage.setItem('incomeSource', incomeSource);
        
        updateStats();
        createProgressChart();
        incomeModal.classList.remove('active');
    });

    // Close Income Modal
    incomeModal.querySelector('.close-btn').addEventListener('click', () => {
        incomeModal.classList.remove('active');
    });

    incomeModal.querySelector('.cancel-btn').addEventListener('click', () => {
        incomeModal.classList.remove('active');
    });

    // Navigation
    document.querySelectorAll('.sidebar nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href').substring(1); // Remove #
            
            // Remove active class from all links
            document.querySelectorAll('.sidebar nav a').forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            link.classList.add('active');

            switch(href) {
                case 'overview':
                    document.querySelector('.stats-container').scrollIntoView({ behavior: 'smooth' });
                    break;
                case 'income':
                    incomeCard.click();
                    break;
                case 'emi':
                    document.getElementById('emiSection').scrollIntoView({ behavior: 'smooth' });
                    break;
                case 'history':
                    document.getElementById('historySection').scrollIntoView({ behavior: 'smooth' });
                    break;
                case 'report':
                    generateReport();
                    break;
                case 'Delete':
                    window.scrollTo({
                        top: document.documentElement.scrollHeight,
                        behavior: 'smooth'
                    });
                    break;
            }
        });
    });

    // Chart instances
    let timelineChart = null;
    let distributionChart = null;
    let progressChart = null;

    // EMI Calculator
    function calculateEMI(principal, rate, tenure) {
        const monthlyRate = (rate / 12) / 100;
        const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenure) / (Math.pow(1 + monthlyRate, tenure) - 1);
        return emi;
    }

    // Update Statistics
    function updateStats() {
        const totalDebt = emis.reduce((sum, emi) => sum + emi.loanAmount, 0);
        const monthlyPayment = emis.reduce((sum, emi) => {
            return sum + calculateEMI(emi.loanAmount, emi.interestRate, emi.tenure);
        }, 0);
        const debtToIncome = monthlyIncome ? ((monthlyPayment / monthlyIncome) * 100) : 0;

        document.getElementById('totalDebt').textContent = totalDebt.toLocaleString();
        document.getElementById('monthlyIncome').textContent = monthlyIncome.toLocaleString();
        document.getElementById('debtToIncome').textContent = debtToIncome.toFixed(1);

        // Update chart colors based on debt-to-income ratio
        const chartColors = {
            safe: '#36a2eb',
            warning: '#ffce56',
            danger: '#ff6384'
        };

        const pieChartColor = debtToIncome > 60 ? chartColors.danger :
                            debtToIncome > 40 ? chartColors.warning :
                            chartColors.safe;

        if (progressChart) {
            progressChart.data.datasets[0].backgroundColor[0] = pieChartColor;
            progressChart.update();
        }
    }

    // Create Timeline Chart
    function createTimelineChart() {
        const ctx = document.getElementById('emiTimelineChart').getContext('2d');
        
        // Prepare data for timeline
        const labels = [];
        const emiData = [];
        const today = new Date();
        
        // Get next 12 months
        for (let i = 0; i < 12; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
            labels.push(date.toLocaleString('default', { month: 'short', year: '2-digit' }));
            
            // Calculate total EMI for this month
            const monthlyTotal = emis.reduce((sum, emi) => {
                const startDate = new Date(emi.startDate);
                const endDate = new Date(startDate.setMonth(startDate.getMonth() + emi.tenure));
                if (date >= new Date(emi.startDate) && date <= endDate) {
                    return sum + calculateEMI(emi.loanAmount, emi.interestRate, emi.tenure);
                }
                return sum;
            }, 0);
            
            emiData.push(monthlyTotal);
        }

        if (timelineChart) {
            timelineChart.destroy();
        }

        timelineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Monthly EMI',
                    data: emiData,
                    borderColor: '#36a2eb',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#8b8d97'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#8b8d97'
                        }
                    }
                }
            }
        });
    }

    // Create Distribution Chart
    function createDistributionChart() {
        const ctx = document.getElementById('debtDistributionChart').getContext('2d');
        
        const loanTypes = {};
        emis.forEach(emi => {
            loanTypes[emi.loanType] = (loanTypes[emi.loanType] || 0) + emi.loanAmount;
        });

        if (distributionChart) {
            distributionChart.destroy();
        }

        distributionChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(loanTypes),
                datasets: [{
                    data: Object.values(loanTypes),
                    backgroundColor: [
                        '#ff6384',
                        '#36a2eb',
                        '#ffce56',
                        '#4bc0c0',
                        '#9966ff'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#8b8d97'
                        }
                    }
                }
            }
        });
    }

    // Create Progress Chart
    function createProgressChart() {
        const ctx = document.getElementById('paymentProgressChart').getContext('2d');
        
        const monthlyPayment = emis.reduce((sum, emi) => {
            return sum + calculateEMI(emi.loanAmount, emi.interestRate, emi.tenure);
        }, 0);

        const remainingIncome = Math.max(monthlyIncome - monthlyPayment, 0);

        if (progressChart) {
            progressChart.destroy();
        }

        progressChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['EMI Payments', 'Remaining Income'],
                datasets: [{
                    data: [monthlyPayment, remainingIncome],
                    backgroundColor: [
                        '#ff6384',
                        '#36a2eb'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#8b8d97'
                        }
                    }
                }
            }
        });
    }

    // Update EMI Calendar
    function updateEMICalendar() {
        const calendar = document.getElementById('emiCalendar');
        calendar.innerHTML = '';
        
        const today = new Date();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        
        // Create calendar grid
        for (let i = 1; i <= daysInMonth; i++) {
            const day = document.createElement('div');
            day.className = 'calendar-day';
            
            // Check if any EMI is due on this day
            const hasEMI = emis.some(emi => {
                const emiDate = new Date(emi.startDate);
                return emiDate.getDate() === i;
            });
            
            if (hasEMI) {
                day.classList.add('has-emi');
            }
            
            day.textContent = i;
            calendar.appendChild(day);
        }
    }

    // Generate Report
    function generateReport() {
        const totalDebt = emis.reduce((sum, emi) => sum + emi.loanAmount, 0);
        const monthlyPayment = emis.reduce((sum, emi) => {
            return sum + calculateEMI(emi.loanAmount, emi.interestRate, emi.tenure);
        }, 0);
        const debtToIncome = monthlyIncome ? ((monthlyPayment / monthlyIncome) * 100) : 0;

        const reportSummary = document.getElementById('reportSummary');
        reportSection.classList.remove('hidden');
        
        let reportHTML = `
            <div class="report-summary">
                <h3>Debt Overview</h3>
                <p>Total Debt: $${totalDebt.toLocaleString()}</p>
                <p>Monthly Income: $${monthlyIncome.toLocaleString()}</p>
                <p>Monthly EMI Payments: $${monthlyPayment.toLocaleString()}</p>
                <p>Debt to Income Ratio: ${debtToIncome.toFixed(1)}%</p>
                
                <h3>Loan Details</h3>
                ${emis.map(emi => `
                    <p><strong>${emi.loanType} Loan:</strong></p>
                    <p>Amount: $${emi.loanAmount.toLocaleString()}</p>
                    <p>Monthly EMI: $${calculateEMI(emi.loanAmount, emi.interestRate, emi.tenure).toFixed(2)}</p>
                    <p>Remaining Tenure: ${emi.tenure - Math.floor((new Date() - new Date(emi.startDate)) / (1000 * 60 * 60 * 24 * 30))} months</p>
                `).join('<br>')}
                
                ${debtToIncome > 60 ? `
                    <div class="warning-high">
                        <i class="fas fa-exclamation-triangle"></i>
                        Warning: Your debt-to-income ratio is high (${debtToIncome.toFixed(1)}%). Consider debt consolidation or financial counseling.
                    </div>
                ` : `
                    <div class="warning-low">
                        <i class="fas fa-check-circle"></i>
                        Good news! Your debt-to-income ratio is within acceptable limits (${debtToIncome.toFixed(1)}%).
                    </div>
                `}
            </div>
        `;

        reportSummary.innerHTML = reportHTML;
        reportSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Expert Advice Button
    expertAdviceBtn.addEventListener('click', () => {
        // Redirect to AI Expert page or show AI advice modal
        window.location.href = 'finance-tracker.html';
    });

    // Event Listeners
    addBtn.addEventListener('click', () => {
        modal.classList.add('active');
    });

    generateReportBtn.addEventListener('click', generateReport);

    const closeModal = () => {
        modal.classList.remove('active');
        form.reset();
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Form Submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newEMI = {
            id: Date.now(),
            loanType: document.getElementById('loanType').value,
            loanAmount: parseFloat(document.getElementById('loanAmount').value),
            interestRate: parseFloat(document.getElementById('interestRate').value),
            tenure: parseInt(document.getElementById('tenure').value),
            startDate: document.getElementById('startDate').value
        };

        emis.push(newEMI);
        localStorage.setItem('emis', JSON.stringify(emis));
        
        updateStats();
        createTimelineChart();
        createDistributionChart();
        createProgressChart();
        updateEMICalendar();
        closeModal();
    });

    const resetDataBtn = document.getElementById("resetDataBtn");
    const resetConfirmationModal = document.getElementById("resetConfirmationModal");
    const confirmResetBtn = document.getElementById("confirmResetBtn");
    const cancelResetBtn = document.getElementById("cancelResetBtn");

    // Open the reset confirmation modal
    resetDataBtn.addEventListener("click", () => {
        resetConfirmationModal.style.display = "flex";
    });

    // Confirm reset action
    confirmResetBtn.addEventListener("click", () => {
        // Set flag to scroll to top after refresh
        localStorage.setItem('scrollToTop', 'true');
        
        // Clear all stored data
        localStorage.removeItem('emis');
        localStorage.removeItem('monthlyIncome');
        localStorage.removeItem('incomeSource');
        
        // Reset all variables
        emis = [];
        monthlyIncome = 0;
        incomeSource = 'Salary';
        
        // Close the modal
        resetConfirmationModal.style.display = "none";
        
        // Refresh the page
        location.href = window.location.href;
    });

    // Cancel reset action
    cancelResetBtn.addEventListener("click", () => {
        resetConfirmationModal.style.display = "none";
    });

    // Close the modal if user clicks outside of it
    window.addEventListener("click", (event) => {
        if (event.target === resetConfirmationModal) {
            resetConfirmationModal.style.display = "none";
        }
    });

    // Initial render
    updateStats();
    createTimelineChart();
    createDistributionChart();
    createProgressChart();
    updateEMICalendar();
});
