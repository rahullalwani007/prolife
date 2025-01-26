document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const modal = document.getElementById('subscriptionModal');
    const addBtn = document.getElementById('addSubscriptionBtn');
    const closeBtn = document.querySelector('.close-btn');
    const cancelBtn = document.querySelector('.cancel-btn');
    const form = document.getElementById('subscriptionForm');
    const logoInput = document.getElementById('subscriptionLogo');
    const logoPreview = document.getElementById('logoPreview');
    const uploadPlaceholder = document.querySelector('.upload-placeholder');
    const subscriptionsGrid = document.getElementById('subscriptionsGrid');
    const subscriptionTemplate = document.getElementById('subscriptionTemplate');
    const calculateBtn = document.getElementById('calculateExpenseBtn');
    const expenseModal = document.getElementById('expenseCalculatorModal');
    const totalIncomeInput = document.getElementById('totalIncome');
    const totalSubscriptionsEl = document.getElementById('totalSubscriptions');
    const activeSubscriptionsCostEl = document.getElementById('activeSubscriptionsCost');
    const remainingBalanceEl = document.getElementById('remainingBalance');
    const expensePercentageEl = document.getElementById('expensePercentage');
    const expenseRecommendation = document.getElementById('expenseRecommendation');
    const expenseChart = document.getElementById('expenseChart');

    // Load Chart.js
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    document.head.appendChild(script);

    let chart = null;

    // Subscription Data Store
    let subscriptions = JSON.parse(localStorage.getItem('subscriptions')) || [];

    // Event Listeners
    addBtn.addEventListener('click', () => {
        modal.classList.add('active');
    });

    const closeModal = () => {
        modal.classList.remove('active');
        form.reset();
        logoPreview.classList.add('hidden');
        uploadPlaceholder.style.display = 'flex';
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Logo Upload Preview
    logoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                logoPreview.src = e.target.result;
                logoPreview.classList.remove('hidden');
                uploadPlaceholder.style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    });

    // Form Submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const subscription = {
            id: Date.now(),
            name: document.getElementById('subscriptionName').value,
            reason: document.getElementById('subscriptionReason').value,
            amount: document.getElementById('subscriptionAmount').value,
            link: document.getElementById('subscriptionLink').value,
            logo: logoPreview.src,
            status: 'active'
        };

        subscriptions.push(subscription);
        localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
        renderSubscriptions();
        closeModal();
    });

    // Render Subscriptions
    const renderSubscriptions = () => {
        subscriptionsGrid.innerHTML = '';
        subscriptions.forEach(subscription => {
            const card = subscriptionTemplate.content.cloneNode(true);
            
            // Set subscription details
            card.querySelector('.subscription-logo img').src = subscription.logo;
            card.querySelector('.subscription-name').textContent = subscription.name;
            card.querySelector('.subscription-reason').textContent = subscription.reason;
            card.querySelector('.subscription-amount').textContent = `₹${subscription.amount}/month`;

            // Set status buttons
            const activeBtn = card.querySelector('[data-status="active"]');
            const inactiveBtn = card.querySelector('[data-status="inactive"]');
            
            if (subscription.status === 'active') {
                activeBtn.classList.add('selected');
            } else {
                inactiveBtn.classList.add('selected');
            }

            // Status toggle functionality
            activeBtn.addEventListener('click', () => {
                if (subscription.status !== 'active') {
                    subscription.status = 'active';
                    localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
                    renderSubscriptions();
                }
            });

            inactiveBtn.addEventListener('click', () => {
                if (subscription.status !== 'inactive') {
                    // Open subscription management link in new tab
                    window.open(subscription.link, '_blank');
                    subscription.status = 'inactive';
                    localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
                    renderSubscriptions();
                }
            });

            // Add tooltip to inactive button
            inactiveBtn.setAttribute('title', 'Click to manage subscription at ' + subscription.link);

            // Delete functionality
            const deleteBtn = card.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this subscription?')) {
                    subscriptions = subscriptions.filter(s => s.id !== subscription.id);
                    localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
                    renderSubscriptions();
                }
            });

            subscriptionsGrid.appendChild(card);
        });
    };

    // Event Listeners for Calculator
    calculateBtn.addEventListener('click', () => {
        expenseModal.classList.add('active');
        calculateExpenses();
    });

    expenseModal.querySelector('.close-btn').addEventListener('click', () => {
        expenseModal.classList.remove('active');
    });

    totalIncomeInput.addEventListener('input', calculateExpenses);

    function calculateExpenses() {
        const income = parseFloat(totalIncomeInput.value) || 0;
        const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
        const totalCost = activeSubscriptions.reduce((sum, sub) => sum + parseFloat(sub.amount), 0);
        const remaining = Math.max(0, income - totalCost);
        const percentage = income > 0 ? ((totalCost / income) * 100) : 0;

        // Update summary with proper formatting
        totalSubscriptionsEl.textContent = activeSubscriptions.length;
        activeSubscriptionsCostEl.textContent = `₹${totalCost.toFixed(2)}`;
        remainingBalanceEl.textContent = `₹${remaining.toFixed(2)}`;
        expensePercentageEl.textContent = `${percentage.toFixed(1)}%`;

        // Update recommendations
        updateRecommendations(percentage, activeSubscriptions, remaining);

        // Update chart
        updateExpenseChart(totalCost, remaining);
    }

    function updateExpenseChart(totalCost, remaining) {
        if (chart) {
            chart.destroy();
        }

        const ctx = expenseChart.getContext('2d');
        
        // Only show data if there are actual values
        const data = totalCost > 0 ? [totalCost, remaining] : [0, 100];
        const labels = totalCost > 0 ? ['Subscriptions', 'Remaining Balance'] : ['No Active Subscriptions'];
        const colors = totalCost > 0 ? 
            ['rgba(138, 43, 226, 0.8)', 'rgba(75, 0, 130, 0.8)'] : 
            ['rgba(200, 200, 200, 0.8)'];
        const borderColors = totalCost > 0 ? 
            ['rgba(138, 43, 226, 1)', 'rgba(75, 0, 130, 1)'] : 
            ['rgba(200, 200, 200, 1)'];

        chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderColor: borderColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                family: "'Poppins', sans-serif",
                                size: 12
                            },
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `₹${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '70%',
                animation: {
                    animateRotate: true,
                    animateScale: true
                }
            }
        });
    }

    function updateRecommendations(percentage, activeSubscriptions, remaining) {
        let recommendations = '<h3>Recommendations</h3><ul>';
        const totalCost = activeSubscriptions.reduce((sum, sub) => sum + parseFloat(sub.amount), 0);

        if (totalCost === 0) {
            recommendations += '<li class="info">No active subscriptions. Add your subscriptions to see expense analysis.</li>';
        } else if (remaining < 0 || percentage >= 90) {
            recommendations += '<li class="critical">⚠️ Your subscriptions are not managed correctly! The total cost exceeds or nearly equals your income.</li>';
            recommendations += '<li>Immediate action required:</li>';
            recommendations += '<li>• Either increase your income or reduce subscription expenses</li>';
            
            // Sort and show all subscriptions by amount for review
            const sortedSubscriptions = [...activeSubscriptions]
                .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
            
            recommendations += '<li>Review these subscriptions in order of cost:</li>';
            sortedSubscriptions.forEach(sub => {
                recommendations += `<li>• ${sub.name}: ₹${parseFloat(sub.amount).toFixed(2)}/month</li>`;
            });
        } else if (percentage <= 50) {
            recommendations += '<li class="success">✅ Your subscription expenses are well managed!</li>';
            recommendations += '<li>Great job! Your subscriptions take up less than half of your income.</li>';
            recommendations += `<li>Current savings: ₹${remaining.toFixed(2)}/month</li>`;
        } else {
            recommendations += '<li class="warning">⚠️ Your subscription expenses are moderate to high.</li>';
            recommendations += '<li>Consider reviewing these top expenses:</li>';
            
            // Show top 3 expensive subscriptions
            const expensiveSubscriptions = [...activeSubscriptions]
                .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
                .slice(0, 3);
            
            expensiveSubscriptions.forEach(sub => {
                recommendations += `<li>• ${sub.name}: ₹${parseFloat(sub.amount).toFixed(2)}/month</li>`;
            });
        }

        recommendations += '</ul>';
        expenseRecommendation.innerHTML = recommendations;

        // Update the color of the expense percentage based on the condition
        if (remaining < 0 || percentage >= 90) {
            expensePercentageEl.style.color = '#ff0000'; // Red for critical
        } else if (percentage <= 50) {
            expensePercentageEl.style.color = '#00cc00'; // Green for good
        } else {
            expensePercentageEl.style.color = '#ffa500'; // Orange for warning
        }
    }

    // Add event listener for income input to recalculate immediately
    totalIncomeInput.addEventListener('input', calculateExpenses);

    // Initial render
    renderSubscriptions();
});
