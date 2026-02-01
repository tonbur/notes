const getWindow = (node) => {
    return node?.ownerDocument?.defaultView || window;
};
const getDocument = (node) => {
    return node?.ownerDocument || document;
};
const isElement = (node) => {
    return node instanceof Element || node instanceof getWindow(node).Element;
};
const isHTMLElement = (node) => {
    return node instanceof HTMLElement || node instanceof getWindow(node).HTMLElement;
};
const getBoundingClientRect = (element) => {
    return element.getBoundingClientRect();
};
const getDocumentElement = (node) => {
    return getDocument(node).documentElement;
};
function computePosition(reference, floating, options = {}) {
    const { placement = 'bottom', strategy = 'fixed' } = options;
    const refRect = getBoundingClientRect(reference);
    const floatRect = getBoundingClientRect(floating);
    let x = 0;
    let y = 0;
    switch (placement) {
        case 'top':
            x = refRect.left + refRect.width / 2 - floatRect.width / 2;
            y = refRect.top - floatRect.height;
            break;
        case 'bottom':
            x = refRect.left + refRect.width / 2 - floatRect.width / 2;
            y = refRect.bottom;
            break;
        case 'left':
            x = refRect.left - floatRect.width;
            y = refRect.top + refRect.height / 2 - floatRect.height / 2;
            break;
        case 'right':
            x = refRect.right;
            y = refRect.top + refRect.height / 2 - floatRect.height / 2;
            break;
        default:
            x = refRect.left + refRect.width / 2 - floatRect.width / 2;
            y = refRect.bottom;
    }
    const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
    };
    if (x < 0) x = 8;
    if (y < 0) y = 8;
    if (x + floatRect.width > viewport.width) {
        x = viewport.width - floatRect.width - 8;
    }
    if (y + floatRect.height > viewport.height) {
        y = viewport.height - floatRect.height - 8;
    }
    return { x, y, placement, strategy };
}
let currentPopover = null;
const popoverCache = new Map();
async function showPopover(event) {
    const link = event.currentTarget;
    if (link.dataset.noPopover === 'true') return;
    const href = link.getAttribute('href');
    if (!href) return;
    const url = new URL(href, window.location.origin);
    const hash = decodeURIComponent(url.hash);
    url.hash = '';
    url.search = '';
    const popoverId = `popover-${url.pathname}`;
    let popover = document.getElementById(popoverId);
    if (!popover) {
        popover = await createPopover(url, popoverId);
        if (!popover) return;
    }
    currentPopover = popover;
    popover.classList.add('active-popover');
    const position = computePosition(link, popover, {
        placement: 'bottom',
        strategy: 'fixed'
    });
    Object.assign(popover.style, {
        transform: `translate(${position.x}px, ${position.y}px)`,
        position: 'fixed'
    });
    if (hash) {
        const targetId = `popover-internal-${hash.slice(1)}`;
        const target = popover.querySelector(`#${targetId}`);
        if (target) {
            const inner = popover.querySelector('.popover-inner');
            if (inner) {
                inner.scroll({
                    top: target.offsetTop - 12,
                    behavior: 'instant'
                });
            }
        }
    }
}
function hidePopover() {
    if (currentPopover) {
        currentPopover.classList.remove('active-popover');
        currentPopover = null;
    }
    document.querySelectorAll('.popover').forEach(p => {
        p.classList.remove('active-popover');
    });
}
async function createPopover(url, popoverId) {
    try {
        const response = await fetch(url.toString());
        if (!response.ok) return null;
        const contentType = response.headers.get('Content-Type')?.split(';')[0];
        const [type, subtype] = contentType ? contentType.split('/') : ['text', 'html'];
        const popover = document.createElement('div');
        popover.id = popoverId;
        popover.classList.add('popover');
        const inner = document.createElement('div');
        inner.classList.add('popover-inner');
        inner.dataset.contentType = contentType || 'text/html';
        popover.appendChild(inner);
        switch (type) {
            case 'image': {
                const img = document.createElement('img');
                img.src = url.toString();
                img.alt = url.pathname;
                inner.appendChild(img);
                break;
            }
            case 'application': {
                if (subtype === 'pdf') {
                    const iframe = document.createElement('iframe');
                    iframe.src = url.toString();
                    inner.appendChild(iframe);
                }
                break;
            }
            default: {
                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                doc.querySelectorAll('[href]').forEach(el => {
                    const href = el.getAttribute('href');
                    if (href && !href.startsWith('http')) {
                        el.setAttribute('href', new URL(href, url).href);
                    }
                });
                doc.querySelectorAll('[src]').forEach(el => {
                    const src = el.getAttribute('src');
                    if (src && !src.startsWith('http')) {
                        el.setAttribute('src', new URL(src, url).href);
                    }
                });
                doc.querySelectorAll('[id]').forEach(el => {
                    el.id = `popover-internal-${el.id}`;
                });
                const hints = [...doc.getElementsByClassName('popover-hint')];
                if (hints.length === 0) return null;
                hints.forEach(hint => inner.appendChild(hint));
                break;
            }
        }
        document.body.appendChild(popover);
        popoverCache.set(popoverId, popover);
        return popover;
    } catch (error) {
        console.error('Failed to create popover:', error);
        return null;
    }
}
function initPopovers() {
    const links = document.querySelectorAll('a.internal');
    links.forEach(link => {
        link.addEventListener('mouseenter', showPopover);
        link.addEventListener('mouseleave', hidePopover);
        if (window.addCleanup) {
            window.addCleanup(() => {
                link.removeEventListener('mouseenter', showPopover);
                link.removeEventListener('mouseleave', hidePopover);
            });
        }
    });
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPopovers);
} else {
    initPopovers();
}
document.addEventListener('nav', initPopovers);
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initPopovers,
        showPopover,
        hidePopover
    };
}
