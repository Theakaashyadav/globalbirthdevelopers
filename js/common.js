function loadComponent(id, file){
    fetch(file)
    .then(res => {
        if(!res.ok){
            throw new Error(`Unable to load ${file}: HTTP ${res.status}`);
        }

        return res.text();
    })
    .then(data => {
        const target = document.getElementById(id);
        if(!target) return;

        target.innerHTML = data;

        if(id === "header"){
            initMobileMenu();
            initActiveNavigation();
        }
    })
    .catch(error => {
        console.error(error);
    });
}

function initPageChrome(){
    if(!document.querySelector(".scroll-progress")){
        const progress = document.createElement("div");
        progress.className = "scroll-progress";
        document.body.appendChild(progress);
    }

    if(!document.querySelector(".back-to-top")){
        const backToTop = document.createElement("button");
        backToTop.className = "back-to-top";
        backToTop.type = "button";
        backToTop.setAttribute("aria-label", "Back to top");
        backToTop.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
        document.body.appendChild(backToTop);

        backToTop.addEventListener("click", () => {
            window.scrollTo({top:0, behavior:"smooth"});
        });
    }

    const progress = document.querySelector(".scroll-progress");
    const backToTop = document.querySelector(".back-to-top");

    const updateChrome = () => {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progressValue = maxScroll > 0 ? window.scrollY / maxScroll : 0;

        if(progress){
            progress.style.transform = `scaleX(${Math.min(Math.max(progressValue, 0), 1)})`;
        }

        if(backToTop){
            backToTop.classList.toggle("visible", window.scrollY > 520);
        }
    };

    updateChrome();
    window.addEventListener("scroll", updateChrome, {passive:true});
    window.addEventListener("resize", updateChrome);
}

function initScrollReveal(){
    const revealSelectors = [
        ".section-card",
        ".section-title",
        ".card",
        ".project-card",
        ".property-card",
        ".advantage-card",
        ".office-card",
        ".team-card",
        ".testimonial-card",
        ".detail-card",
        ".gallery-item",
        ".fact-card",
        ".media-tile",
        ".route-map",
        ".about-img",
        ".about-image",
        ".about-content",
        ".ceo-img",
        ".ceo-content",
        ".contact-form-box",
        ".map-box",
        ".why-item",
        ".stat",
        ".investment-box"
    ];

    const elements = document.querySelectorAll(revealSelectors.join(","));

    elements.forEach((element, index) => {
        element.classList.add("reveal-on-scroll");

        if(element.matches(".about-img, .about-image, .ceo-img, .contact-form-box")){
            element.classList.add("reveal-left");
        }

        if(element.matches(".about-content, .ceo-content, .map-box, .route-map")){
            element.classList.add("reveal-right");
        }

        if(element.matches(".card, .project-card, .property-card, .advantage-card, .gallery-item, .fact-card, .media-tile, .stat")){
            element.classList.add("reveal-scale");
        }

        const parent = element.parentElement;
        const siblings = parent ? Array.from(parent.children).filter(child => child.matches(revealSelectors.join(","))) : [];
        const siblingIndex = Math.max(0, siblings.indexOf(element));
        const delay = Math.min(siblingIndex * 80, 420);
        element.style.setProperty("--reveal-delay", `${delay}ms`);
    });

    if(!("IntersectionObserver" in window)){
        elements.forEach(element => element.classList.add("revealed"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting){
                entry.target.classList.add("revealed");
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold:0.14,
        rootMargin:"0px 0px -8% 0px"
    });

    elements.forEach(element => observer.observe(element));
}

function initMobileMenu(){
    const hamburger = document.getElementById("hamburger");
    const menu = document.getElementById("menu");

    if(!hamburger || !menu) return;

    hamburger.addEventListener("click", () => {
        menu.classList.toggle("active");

        const isOpen = menu.classList.contains("active");
        hamburger.setAttribute("aria-expanded", String(isOpen));
        hamburger.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");

        hamburger.innerHTML = isOpen
            ? '<i class="fa-solid fa-xmark" aria-hidden="true"></i>'
            : '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
    });

    menu.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            menu.classList.remove("active");
            hamburger.setAttribute("aria-expanded", "false");
            hamburger.setAttribute("aria-label", "Open navigation");
            hamburger.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
        });
    });

    document.addEventListener("keydown", event => {
        if(event.key !== "Escape" || !menu.classList.contains("active")) return;

        menu.classList.remove("active");
        hamburger.setAttribute("aria-expanded", "false");
        hamburger.setAttribute("aria-label", "Open navigation");
        hamburger.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
        hamburger.focus();
    });
}

function initActiveNavigation(){
    const links = document.querySelectorAll(".menu a");
    const currentPage = (location.pathname.split("/").pop() || "index.html").toLowerCase();

    links.forEach(link => {
        const linkPage = (new URL(link.href, location.href).pathname.split("/").pop() || "index.html").toLowerCase();

        link.classList.toggle("active", linkPage === currentPage);
    });
}

loadComponent('header','header.html');
loadComponent('footer','footer.html');
loadComponent('floating','floating.html');

if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", () => {
        initPageChrome();
        initScrollReveal();
    });
}else{
    initPageChrome();
    initScrollReveal();
}
