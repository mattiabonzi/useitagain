$(document).ready(() => {
    hideShowBlogpost();
    $('.btn-tag').on('click', (e) => {
        window.location.href = "/articles/#"+encodeURIComponent(e.target.innerHTML);
        hideShowBlogpost();
    })
    function hideShowBlogpost() {
        var hash = decodeURIComponent(window.location.hash.substring(1).toLowerCase());
        console.log(hash);
        if (hash) {
            $(".article").each((i,e) => {
                if (!e.innerHTML.toLowerCase().includes('btn-tag">'+hash)) {
                    $(e).hide()
                } else {
                    $(e).show()
                }
            })
        }
    }
})



