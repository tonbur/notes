let allBooks = [];
let selectedTags = new Set();
async function loadBooks() {
    try {
        const response = await fetch('data/books.json');
        allBooks = await response.json();
        initializeFilters();
        displayBooks(allBooks);
    } catch (error) {
        console.error('Ошибка загрузки библиотеки:', error);
        document.getElementById('bookGrid').innerHTML = 
            '<div class="loading">Ошибка загрузки библиотеки. Проверьте файл data/books.json</div>';
    }
}
function initializeFilters() {
    const tagCounts = {};
    allBooks.forEach(book => {
        if (book.tags && Array.isArray(book.tags)) {
            book.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        }
    });
    const sortedTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([tag, count]) => ({ tag, count }));
    const filterCheckboxes = document.getElementById('filterCheckboxes');
    if (sortedTags.length === 0) {
        filterCheckboxes.innerHTML = '<p class="no-tags">Теги отсутствуют</p>';
        return;
    }
    filterCheckboxes.innerHTML = sortedTags.map(({ tag, count }) => `
        <label class="filter-checkbox">
            <input type="checkbox" value="${tag}" class="tag-checkbox">
            <span class="checkbox-label">${tag} (${count})</span>
        </label>
    `).join('');
    document.querySelectorAll('.tag-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedTags.add(e.target.value);
            } else {
                selectedTags.delete(e.target.value);
            }
            filterBooks();
        });
    });
    const filterToggle = document.getElementById('filterToggle');
    const filterPanel = document.getElementById('filterPanel');
    filterToggle.addEventListener('click', () => {
        filterPanel.classList.toggle('collapsed');
        const arrow = filterToggle.querySelector('.toggle-arrow');
        arrow.textContent = filterPanel.classList.contains('collapsed') ? '▼' : '▲';
    });
}
function displayBooks(books) {
    const bookGrid = document.getElementById('bookGrid');
    if (books.length === 0) {
        bookGrid.innerHTML = '<div class="no-results">Ничего не найдено</div>';
        return;
    }
    bookGrid.innerHTML = books.map(book => `
        <a href="book.html?id=${book.id}" class="book-card">
            <img src="${book.cover}" alt="${book.title}" class="book-cover" 
                 onerror="this.onerror=null; this.src='assets/covers/placeholder.svg'">
            <h3>${book.title}</h3>
            <p class="author">${book.author}</p>
            ${book.dateAdded ? `<p class="date-added">${new Date(book.dateAdded).toLocaleDateString('ru-RU', {year: 'numeric', month: 'long', day: 'numeric'})}</p>` : ''}
            ${book.tags && book.tags.length > 0 ? `
                <div class="tag-list">
                    ${book.tags.map(tag => `<span class="tag-badge">${tag}</span>`).join('')}
                </div>
            ` : ''}
        </a>
    `).join('');
    setTimeout(() => {
        document.querySelectorAll('.book-cover').forEach(img => {
            if (!img.complete || img.naturalHeight === 0) {
                img.onerror = null;
                img.src = 'assets/covers/placeholder.svg';
            }
        });
    }, 100);
}
function filterBooks() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    let filteredBooks = allBooks.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchTerm) ||
                            book.author.toLowerCase().includes(searchTerm);
        if (selectedTags.size === 0) {
            return matchesSearch;
        }
        const matchesTags = book.tags && book.tags.some(tag => selectedTags.has(tag));
        return matchesSearch && matchesTags;
    });
    displayBooks(filteredBooks);
}
document.getElementById('searchInput').addEventListener('input', () => {
    filterBooks();
});
loadBooks();
