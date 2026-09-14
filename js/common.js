function loadComponent(id, file){
    fetch(file)
    .then(res => res.text())
    .then(data => {
        const target = document.getElementById(id);
        if(!target) return;

        target.innerHTML = data;

        if(id === "header"){
            initMobileMenu();
            initActiveNavigation();
        }
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

function initProjectRoadlines(){
    const roadmapSections = document.querySelectorAll(".project-roadmap");

    roadmapSections.forEach(section => {
        if(section.querySelector(".roadline-tour")) return;

        const factCards = Array.from(section.querySelectorAll(".fact-card"));
        const routeSteps = Array.from(section.querySelectorAll(".route-steps li")).map(step => {
            const title = step.querySelector("b")?.textContent?.trim() || "";
            const detail = step.querySelector("div span")?.textContent?.trim() || "";
            return title && detail ? `${title}: ${detail}` : title || detail;
        }).filter(Boolean);

        const mediaImages = Array.from(section.querySelectorAll(".roadmap-media img")).map(img => img.src).filter(Boolean);
        const projectFacts = factCards.map(card => ({
            label: card.querySelector("span")?.textContent?.trim() || "Project Detail",
            title: card.querySelector("h3")?.textContent?.trim() || "Project Detail",
            detail: card.querySelector("p")?.textContent?.trim() || "Tap to view more details."
        }));

        const timelineItems = [
            ...projectFacts,
            {
                label:"Media",
                title:"Images & Walkthrough",
                detail:"View project images, surroundings, and the official video walkthrough space for a richer site-visit preview.",
                media:mediaImages
            },
            {
                label:"Route",
                title:"Delhi to Ramnagar Landmarks",
                detail:routeSteps.join(" | ")
            }
        ];

        const tour = document.createElement("div");
        tour.className = "roadline-tour";
        tour.innerHTML = `
            <div class="roadline-track" aria-hidden="true"></div>
            <div class="roadline-items">
                ${timelineItems.map((item, index) => `
                    <article class="roadline-item ${index % 2 ? "is-right" : "is-left"}">
                        <div class="roadline-marker">${String(index + 1).padStart(2, "0")}</div>
                        <div class="roadline-panel">
                            <span>${item.label}</span>
                            <h3>${item.title}</h3>
                            <button class="roadline-toggle" type="button" aria-expanded="false">
                                <span>View Details</span>
                                <i class="fa-solid fa-chevron-down"></i>
                            </button>
                            <div class="roadline-dropdown">
                                <p>${item.detail}</p>
                                ${item.media?.length ? `
                                    <div class="roadline-media-strip">
                                        ${item.media.slice(0, 2).map(src => `<img src="${src}" alt="${item.title}">`).join("")}
                                    </div>
                                ` : ""}
                            </div>
                        </div>
                    </article>
                `).join("")}
            </div>
        `;

        const card = section.querySelector(".roadmap-card") || section;
        const layout = section.querySelector(".roadmap-layout");

        if(layout){
            layout.insertAdjacentElement("beforebegin", tour);
        }else{
            card.appendChild(tour);
        }

        tour.querySelectorAll(".roadline-toggle").forEach(button => {
            button.addEventListener("click", () => {
                const item = button.closest(".roadline-item");
                const isOpen = item.classList.toggle("open");
                button.setAttribute("aria-expanded", String(isOpen));
                button.querySelector("span").textContent = isOpen ? "Hide Details" : "View Details";
            });
        });

        section.classList.add("roadline-enhanced");
    });
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
        ".investment-box",
        ".roadline-item",
        ".roadline-panel"
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

        if(element.matches(".card, .project-card, .property-card, .advantage-card, .gallery-item, .fact-card, .media-tile, .stat, .roadline-panel")){
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
            ? '<i class="fa-solid fa-xmark"></i>'
            : '<i class="fa-solid fa-bars"></i>';
    });

    menu.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            menu.classList.remove("active");
            hamburger.setAttribute("aria-expanded", "false");
            hamburger.setAttribute("aria-label", "Open navigation");
            hamburger.innerHTML = '<i class="fa-solid fa-bars"></i>';
        });
    });
}

function initActiveNavigation(){
    const links = document.querySelectorAll(".menu a");
    const currentPage = (location.pathname.split("/").pop() || "index.html").toLowerCase();

    links.forEach(link => {
        const href = link.getAttribute("href") || "";
        const cleanHref = href.split("#")[0] || "index.html";

        link.classList.toggle("active", cleanHref.toLowerCase() === currentPage);
    });
}

function initLeadPopup(){
    const storageKey = "globalbirthUserDetailsSubmitted";

    if(localStorage.getItem(storageKey) === "true" || document.querySelector(".lead-popup-overlay")){
        return;
    }

    const overlay = document.createElement("div");
    overlay.className = "lead-popup-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "lead-popup-title");
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
        <div class="lead-popup">
            <button type="button" class="lead-popup-close" aria-label="Close popup">
                <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>

            <div class="lead-popup-icon" aria-hidden="true">
                <i class="fa-solid fa-user-check"></i>
            </div>
            <span class="lead-popup-kicker">Login Now</span>
            <h2 id="lead-popup-title">Login Now</h2>
            <p>Enter your details to continue browsing our projects and get proper assistance.</p>

            <form class="lead-popup-form" novalidate>
                <label>
                    <span>Full Name</span>
                    <input type="text" name="name" autocomplete="name" required>
                </label>

                <label>
                    <span>Phone Number</span>
                    <input type="tel" name="phone" autocomplete="tel" pattern="[0-9+\\-\\s()]{8,}" required>
                </label>

                <label>
                    <span>Interested In</span>
                    <select name="project" required>
                        <option value="">Select interest</option>
                        <option>Shubhkadam</option>
                        <option>Grah Pravesh</option>
                        <option>Global Green Village</option>
                        <option>Corbett Eye</option>
                        <option>General Enquiry</option>
                    </select>
                </label>

                <p class="lead-popup-error" aria-live="polite"></p>

                <button type="submit" class="lead-popup-submit">
                    Login Now <i class="fa-solid fa-arrow-right"></i>
                </button>
            </form>
        </div>
    `;

    document.body.appendChild(overlay);

    const form = overlay.querySelector(".lead-popup-form");
    const error = overlay.querySelector(".lead-popup-error");
    const firstInput = overlay.querySelector("input");
    const closeButton = overlay.querySelector(".lead-popup-close");

    const showPopup = () => {
        overlay.classList.add("visible");
        overlay.setAttribute("aria-hidden", "false");
        document.body.classList.add("lead-popup-locked");
        window.setTimeout(() => firstInput?.focus(), 120);
    };

    const hidePopup = () => {
        overlay.classList.remove("visible");
        overlay.setAttribute("aria-hidden", "true");
        document.body.classList.remove("lead-popup-locked");
    };

    const focusableSelector = "input, select, button";

    overlay.addEventListener("keydown", event => {
        if(event.key === "Escape"){
            event.preventDefault();
            hidePopup();
            return;
        }

        if(event.key !== "Tab") return;

        const focusable = Array.from(overlay.querySelectorAll(focusableSelector));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if(event.shiftKey && document.activeElement === first){
            event.preventDefault();
            last.focus();
        }else if(!event.shiftKey && document.activeElement === last){
            event.preventDefault();
            first.focus();
        }
    });

    closeButton.addEventListener("click", hidePopup);

    form.addEventListener("submit", event => {
        event.preventDefault();
        error.textContent = "";

        if(!form.checkValidity()){
            error.textContent = "Please fill all details correctly before continuing.";
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const userDetails = Object.fromEntries(formData.entries());
        userDetails.submittedAt = new Date().toISOString();

        localStorage.setItem(storageKey, "true");
        localStorage.setItem("globalbirthUserDetails", JSON.stringify(userDetails));

        hidePopup();
    });

    window.setTimeout(showPopup, 20000);
}

loadComponent('header','header.html');
loadComponent('footer','footer.html');
loadComponent('floating','floating.html');

if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", () => {
        initPageChrome();
        initProjectRoadlines();
        initScrollReveal();
        // Keep search visitors focused on the page. Enquiries are invited through
        // visible, user-initiated calls to action instead of an automatic interstitial.
    });
}else{
    initPageChrome();
    initProjectRoadlines();
    initScrollReveal();
    // Automatic lead interstitial intentionally disabled for mobile usability and SEO.
}
