function highlightSpecialSymbols() {
    const wrapper = document.querySelector('.special-symbols-wrapper');
    if (!wrapper) return;
    const processedNodes = new Set();
    const specialChars = '+.,/#$%^&;:{}=\\-~()"|\u2013@\u2014';
    const punctuationRegex = new RegExp(`[${specialChars.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}|\\d]`, 'gu');
    const exclamationRegex = /[!?]/gu;
    function findTextNodes(node) {
        for (let child of node.childNodes) {
            if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim() !== '') {
                processedNodes.add(child);
            } else if (child.nodeType === Node.ELEMENT_NODE && 
                       !['SCRIPT', 'STYLE', 'A', 'CODE', 'PRE'].includes(child.tagName) &&
                       !child.classList.contains('highlight')) {
                findTextNodes(child);
            }
        }
    }
    findTextNodes(wrapper);
    for (let textNode of processedNodes) {
        const parent = textNode.parentNode;
        if (!parent) continue;
        const fragment = document.createDocumentFragment();
        const text = textNode.textContent;
        let lastIndex = 0;
        let match;
        let matches = [];
        while ((match = punctuationRegex.exec(text)) !== null) {
            matches.push({
                index: match.index,
                end: punctuationRegex.lastIndex,
                className: 'highlight-punctuation'
            });
        }
        punctuationRegex.lastIndex = 0;
        while ((match = exclamationRegex.exec(text)) !== null) {
            matches.push({
                index: match.index,
                end: exclamationRegex.lastIndex,
                className: 'highlight-special'
            });
        }
        exclamationRegex.lastIndex = 0;
        matches.sort((a, b) => a.index - b.index);
        for (let matchItem of matches) {
            if (matchItem.index > lastIndex) {
                fragment.appendChild(document.createTextNode(text.slice(lastIndex, matchItem.index)));
            }
            const span = document.createElement('span');
            span.className = matchItem.className;
            span.textContent = text.slice(matchItem.index, matchItem.end);
            fragment.appendChild(span);
            lastIndex = matchItem.end;
        }
        if (lastIndex < text.length) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        }
        parent.replaceChild(fragment, textNode);
    }
}
function addCopyButtons() {
    const copyIcon = '<svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true"><path fill-rule="evenodd" d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z"></path><path fill-rule="evenodd" d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z"></path></svg>';
    const checkIcon = '<svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true"><path fill-rule="evenodd" fill="rgb(63, 185, 80)" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"></path></svg>';
    const codeBlocks = document.getElementsByTagName('pre');
    for (let i = 0; i < codeBlocks.length; i++) {
        const pre = codeBlocks[i];
        const code = pre.getElementsByTagName('code')[0];
        if (!code) continue;
        const textToCopy = (code.dataset.clipboard 
            ? JSON.parse(code.dataset.clipboard) 
            : code.innerText).replace(/\n\n/g, '\n');
        const button = document.createElement('button');
        button.className = 'clipboard-button';
        button.type = 'button';
        button.innerHTML = copyIcon;
        button.ariaLabel = 'Copy source';
        button.addEventListener('click', function() {
            navigator.clipboard.writeText(textToCopy).then(() => {
                button.blur();
                button.innerHTML = checkIcon;
                setTimeout(() => {
                    button.innerHTML = copyIcon;
                    button.style.borderColor = '';
                }, 2000);
            }, err => console.error(err));
        });
        pre.prepend(button);
    }
}
function initGradientFade() {
    const observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
            const parentElement = entry.target.parentElement;
            if (!parentElement) return;
            if (entry.isIntersecting) {
                parentElement.classList.remove('gradient-active');
            } else {
                parentElement.classList.add('gradient-active');
            }
        }
    });
    const tocContainer = document.querySelector('[data-callout="toc"] .callout-content');
    if (!tocContainer) return;
    const overflowMarker = document.createElement('div');
    overflowMarker.className = 'overflow-end';
    overflowMarker.style.height = '1px';
    overflowMarker.style.width = '100%';
    tocContainer.appendChild(overflowMarker);
    observer.observe(overflowMarker);
    if (window.addCleanup) {
        window.addCleanup(() => observer.disconnect());
    }
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        highlightSpecialSymbols,
        addCopyButtons,
        initGradientFade
    };
}
