/* =========================
   COACH CARTS LAB SCRIPT
   ========================= */

/* ========== MOBILE MENU ========== */

const menuBtn = document.querySelector(".menu-btn");
const navLinks = document.querySelector(".nav-links");

if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", () => {
        navLinks.classList.toggle("active");
    });
}

/* Add mobile menu styling dynamically (light enhancement) */
const style = document.createElement("style");
style.innerHTML = `
.nav-links.active {
    display: flex !important;
    flex-direction: column;
    position: absolute;
    top: 70px;
    right: 8%;
    background: white;
    border: 1px solid #d1fae5;
    padding: 12px;
    border-radius: 12px;
    gap: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.08);
}
`;
document.head.appendChild(style);

/* ========== SCROLL REVEAL ANIMATION ========== */

const revealElements = document.querySelectorAll(
    ".lesson-card, .feature, .coach-card, .faq-item"
);

const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";
                entry.target.style.transition = "0.5s ease";
                observer.unobserve(entry.target);
            }
        });
    },
    {
        threshold: 0.1
    }
);

/* initial state */
revealElements.forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(20px)";
    observer.observe(el);
});

/* ========== SMOOTH SCROLL ENHANCEMENT ========== */

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (e) {
        const target = document.querySelector(this.getAttribute("href"));

        if (target) {
            e.preventDefault();

            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    });
});