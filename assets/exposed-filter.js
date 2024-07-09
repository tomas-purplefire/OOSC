let filters = document.querySelectorAll('.exposed-filter-form-item');
let splides = document.querySelectorAll('div[class*="slider-splide-"]')

filters.forEach((filter) => {
    filter.addEventListener('click', (e) => {
        if (e.target.classList.contains("exposed-filter-form-item__title")) {
            const link = e.target; // clicked link

            const siblings = link.closest(".exposed-filter-form").querySelectorAll(".exposed-filter-form-item");
            link.closest(".exposed-filter-form-item").classList.toggle("opened");

            if (link.closest(".exposed-filter-form-item").classList.contains('opened')) {
                link.closest(".exposed-filter-form").classList.add("opened");
            } else {
                link.closest(".exposed-filter-form").classList.remove("opened");
            }
            siblings.forEach((el) => {
                if (el !== link.closest(".exposed-filter-form-item")) {
                    el.classList.remove("opened");
                }
            });
        }
    })
})

document.addEventListener('collection:reloaded', () => {
    let splides = document.querySelectorAll('div[class*="slider-splide-"]')

    if (window.innerWidth > 768) {
        for ( var i = 0; i < splides.length; i++ ) {
            new Splide( splides[ i ] ).mount();
        }
    }
})


if (window.innerWidth > 768) {
    for ( var i = 0; i < splides.length; i++ ) {
        new Splide( splides[ i ] ).mount();
    }
} else{
    window.addEventListener('scroll', () => {
        window.scrollY > 200 ? document.querySelector('body').classList.add('stuck-scroll') : document.querySelector('body').classList.remove('stuck-scroll');
        window.scrollY > 230 ? document.querySelector('body').classList.add('scroll') : document.querySelector('body').classList.remove('scroll');
    })
}
