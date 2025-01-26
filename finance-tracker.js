document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const modal = document.getElementById('expenseModal');
    const addBtn = document.getElementById('addExpenseBtn');
    const floatingAddBtn = document.getElementById('floatingAddBtn');
    const closeBtn = document.querySelector('.close-btn');
    const cancelBtn = document.querySelector('.cancel-btn');
    const form = document.getElementById('expenseForm');
    const expensesGrid = document.getElementById('expensesGrid');
    const detailsBtn = document.getElementById('detailsBtn');
    const aiAdviceBtn = document.getElementById('aiAdviceBtn');
    const expenseDetails = document.getElementById('expenseDetails');
    const aiAdvice = document.getElementById('aiAdvice');
    const imageInput = document.getElementById('expenseImage');
    const imagePreview = document.getElementById('imagePreview');
    const uploadPlaceholder = document.querySelector('.upload-placeholder');

    // Load expenses from localStorage
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    let totalBalance = parseFloat(document.getElementById('totalBalance').textContent);
    let totalIncome = parseFloat(document.getElementById('totalIncome').textContent);

    // Initialize chart
    let expenseChart = null;

    // Handle image upload preview
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                imagePreview.classList.remove('hidden');
                uploadPlaceholder.style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    });

    // Event Listeners for Modal
    const openModal = () => {
        modal.classList.add('active');
        form.reset();
        form.removeAttribute('data-edit-id');
        imagePreview.classList.add('hidden');
        uploadPlaceholder.style.display = 'flex';
    };

    addBtn.addEventListener('click', openModal);
    floatingAddBtn.addEventListener('click', openModal);

    const closeModal = () => {
        modal.classList.remove('active');
        form.reset();
        imagePreview.classList.add('hidden');
        uploadPlaceholder.style.display = 'flex';
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let imageData = null;
        const imageFile = imageInput.files[0];
        if (imageFile) {
            imageData = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(imageFile);
            });
        }

        const expenseId = form.dataset.editId;
        const newExpense = {
            id: expenseId ? parseInt(expenseId) : Date.now(),
            category: document.getElementById('expenseCategory').value,
            amount: parseFloat(document.getElementById('expenseAmount').value),
            date: document.getElementById('expenseDate').value,
            description: document.getElementById('expenseDescription').value,
            image: imageData || (expenseId ? expenses.find(e => e.id === parseInt(expenseId))?.image : null)
        };

        if (expenseId) {
            const index = expenses.findIndex(e => e.id === parseInt(expenseId));
            if (index !== -1) {
                expenses[index] = newExpense;
            }
            form.removeAttribute('data-edit-id');
        } else {
            expenses.push(newExpense);
        }

        localStorage.setItem('expenses', JSON.stringify(expenses));
        renderExpenses();
        updateTotals();
        closeModal();
    });

    // Delete expense
    function deleteExpense(id) {
        if (confirm('Are you sure you want to delete this expense?')) {
            expenses = expenses.filter(expense => expense.id !== id);
            localStorage.setItem('expenses', JSON.stringify(expenses));
            renderExpenses();
            updateTotals();
        }
    }

    // Edit expense
    function editExpense(id) {
        const expense = expenses.find(expense => expense.id === id);
        if (expense) {
            document.getElementById('expenseCategory').value = expense.category;
            document.getElementById('expenseAmount').value = expense.amount;
            document.getElementById('expenseDate').value = expense.date;
            document.getElementById('expenseDescription').value = expense.description;
            
            if (expense.image) {
                imagePreview.innerHTML = `<img src="${expense.image}" alt="Preview">`;
                imagePreview.classList.remove('hidden');
                uploadPlaceholder.style.display = 'none';
            }

            form.dataset.editId = expense.id;
            modal.classList.add('active');
        }
    }

    // Render Expenses
    function renderExpenses() {
        expensesGrid.innerHTML = '';
        expenses.forEach(expense => {
            const expenseCard = document.createElement('div');
            expenseCard.className = 'expense-card';
            expenseCard.innerHTML = `
                <div class="expense-content">
                    <h4>${expense.category}</h4>
                    <div class="expense-amount">$${expense.amount.toFixed(2)}</div>
                    <div class="expense-date">${new Date(expense.date).toLocaleDateString()}</div>
                    <div class="expense-description">${expense.description}</div>
                    <div class="expense-actions">
                        <button class="action-btn edit-btn" onclick="editExpense(${expense.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteExpense(${expense.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                ${expense.image ? `
                    <div class="expense-card-image">
                        <img src="${expense.image}" alt="Expense receipt">
                    </div>
                ` : `
                    <div class="expense-card-image no-image-placeholder">
                        <i class="fas fa-image"></i>
                    </div>
                `}
            `;
            expensesGrid.appendChild(expenseCard);
        });
    }

    // Update total expenses and balance
    function updateTotals() {
        const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        document.getElementById('totalExpenses').textContent = totalExpenses.toFixed(2);
        document.getElementById('totalBalance').textContent = (totalIncome - totalExpenses).toFixed(2);
    }

    // Create and update chart
    function createExpenseChart() {
        const ctx = document.getElementById('expenseChart').getContext('2d');
        const expensesByCategory = {};
        
        expenses.forEach(expense => {
            expensesByCategory[expense.category] = (expensesByCategory[expense.category] || 0) + expense.amount;
        });

        const categories = Object.keys(expensesByCategory);
        const amounts = Object.values(expensesByCategory);
        
        if (expenseChart) {
            expenseChart.destroy();
        }

        expenseChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [{
                    label: 'Expenses ($)',
                    data: amounts,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(255, 206, 86, 0.5)',
                        'rgba(75, 192, 192, 0.5)',
                        'rgba(153, 102, 255, 0.5)',
                        'rgba(255, 159, 64, 0.5)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // Generate AI advice based on spending patterns
    function generateAIAdvice() {
        const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const expensesByCategory = {};
        
        expenses.forEach(expense => {
            expensesByCategory[expense.category] = (expensesByCategory[expense.category] || 0) + expense.amount;
        });

        const highestExpense = Math.max(...Object.values(expensesByCategory));
        const highestExpenseCategory = Object.keys(expensesByCategory).find(
            key => expensesByCategory[key] === highestExpense
        );
        
        const adviceContent = document.getElementById('adviceContent');
        adviceContent.innerHTML = `
            <p>Based on your spending patterns:</p>
            <ul>
                <li>Your highest expense is ${highestExpenseCategory} at $${highestExpense.toFixed(2)}</li>
                <li>This represents ${Math.round((highestExpense/totalExpenses) * 100)}% of your total expenses</li>
                <li>Consider setting a budget limit for ${highestExpenseCategory} to optimize your savings</li>
                <li>Look for ways to reduce ${highestExpenseCategory.toLowerCase()} costs without compromising quality</li>
            </ul>
        `;
    }

    // Event Listeners for buttons
    detailsBtn.addEventListener('click', () => {
        expenseDetails.classList.toggle('hidden');
        aiAdvice.classList.add('hidden');
        if (!expenseDetails.classList.contains('hidden')) {
            createExpenseChart();
        }
    });

    aiAdviceBtn.addEventListener('click', () => {
        aiAdvice.classList.toggle('hidden');
        expenseDetails.classList.add('hidden');
        if (!aiAdvice.classList.contains('hidden')) {
            generateAIAdvice();
        }
    });

    // Make functions available globally
    window.deleteExpense = deleteExpense;
    window.editExpense = editExpense;

    // Initial render
    renderExpenses();
    updateTotals();
});
