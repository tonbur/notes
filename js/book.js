const urlParams = new URLSearchParams(window.location.search);
const bookId = urlParams.get('id');
async function loadBook() {
    if (!bookId) {
        window.location.href = 'index.html';
        return;
    }
    try {
        const response = await fetch('data/books.json');
        const books = await response.json();
        const book = books.find(b => b.id === bookId);
        if (!book) {
            document.getElementById('markdownContent').innerHTML = 
                '<div class="loading">Книга не найдена</div>';
            return;
        }
        document.getElementById('pageTitle').textContent = book.title;
        document.getElementById('bookTitle').textContent = book.title;
        document.getElementById('bookAuthor').textContent = book.author;
        const coverImg = document.getElementById('bookCover');
        coverImg.src = book.cover;
        coverImg.alt = book.title;
        coverImg.onerror = function() {
            this.onerror = null;
            this.src = 'assets/covers/placeholder.svg';
        };
        const markdownResponse = await fetch(book.notes);
        const markdownText = await markdownResponse.text();
        const htmlContent = marked.parse(markdownText);
        const contentDiv = document.getElementById('markdownContent');
        contentDiv.innerHTML = `<div class="special-symbols-wrapper">${htmlContent}</div>`;
        generateTableOfContents();
        if (typeof addCopyButtons === 'function') {
            addCopyButtons();
        }
        if (typeof initGradientFade === 'function') {
            initGradientFade();
        }
        initTOCActiveTracking();
    } catch (error) {
        console.error('Ошибка загрузки книги:', error);
        document.getElementById('markdownContent').innerHTML = 
            '<div class="loading">Ошибка загрузки конспекта</div>';
    }
}
function generateTableOfContents() {
    const tocCallouts = document.querySelectorAll('[data-callout="toc"]');
    if (tocCallouts.length === 0) return;
    const content = document.getElementById('markdownContent');
    const headings = content.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length === 0) return;
    let tocHTML = '<ul>';
    let baseLevel = parseInt(headings[0].tagName.substring(1));
    headings.forEach(heading => {
        const level = parseInt(heading.tagName.substring(1));
        const text = heading.textContent;
        if (!heading.id) {
            const id = text.toLowerCase()
                .replace(/[^\wа-яё\s-]/gi, '')
                .replace(/\s+/g, '-');
            heading.id = id;
        }
        const depth = level - baseLevel;
        tocHTML += `<li><a href="#${heading.id}" class="depth-${depth}">${text}</a></li>`;
    });
    tocHTML += '</ul>';
    tocCallouts.forEach(callout => {
        let contentInner = callout.querySelector('.callout-content-inner');
        const totalItems = headings.length;
        const shouldCollapse = totalItems > 10;
        if (!contentInner) {
            callout.innerHTML = `
                <div class="callout-title">
                    <div class="callout-icon"></div>
                    <div class="callout-title-inner"><p>Table of Contents</p></div>
                    <div class="fold-callout-icon"></div>
                </div>
                <div class="callout-content">
                    <div class="callout-content-inner"></div>
                </div>
            `;
            contentInner = callout.querySelector('.callout-content-inner');
        }
        contentInner.innerHTML = tocHTML;
        callout.classList.add('is-collapsible');
        if (shouldCollapse) {
            callout.classList.add('is-collapsed');
        }
        const titleElement = callout.querySelector('.callout-title');
        if (titleElement) {
            titleElement.style.cursor = 'pointer';
            titleElement.addEventListener('click', function() {
                callout.classList.toggle('is-collapsed');
            });
        }
    });
}
loadBook();
function initTOCActiveTracking() {
    const content = document.getElementById('markdownContent');
    if (!content) return;
    const headings = content.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]');
    if (headings.length === 0) return;
    const tocLinks = document.querySelectorAll('[data-callout="toc"] a[href^="#"]');
    if (tocLinks.length === 0) return;
    const linkMap = new Map();
    tocLinks.forEach(link => {
        const targetId = link.getAttribute('href').substring(1);
        linkMap.set(targetId, link);
    });
    const observerOptions = {
        root: null,
        rootMargin: '-80px 0px -80% 0px',
        threshold: 0
    };
    let activeId = null;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const id = entry.target.id;
            const link = linkMap.get(id);
            if (!link) return;
            if (entry.isIntersecting) {
                tocLinks.forEach(l => l.classList.remove('in-view'));
                link.classList.add('in-view');
                activeId = id;
            }
        });
    }, observerOptions);
    headings.forEach(heading => {
        observer.observe(heading);
    });
    window.addEventListener('beforeunload', () => {
        observer.disconnect();
    });
}
