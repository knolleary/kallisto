


var menuContainer = document.getElementById("menu");
var menuList = document.createElement("ul");
menuContainer.appendChild(menuList);

export class Menu {
    constructor(options) {
        this.options = options
    }

    show() {
        menuList.innerHTML = "";
        this.options.forEach(function(opt) {
            var item = document.createElement("li");
            var label = document.createElement("a");
            label.innerHTML = opt.label;
            item.appendChild(label);
            menuList.appendChild(item);

            label.addEventListener("click", function(evt) {
                evt.preventDefault();
                if (opt.select) {
                    opt.select.call();
                }
            });

        })
        document.getElementById("menu").classList.add("open")
    }

    hide() {
        document.getElementById("menu").classList.remove("open")
    }

}
