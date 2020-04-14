$(document).ready(function () {
    console.log('document is loaded')
    $('#deleteProduct').on('click', function (e) {
        console.log('press delete button')
        $target = $(e.target)
        const id = $target.attr('data-id')
        // console.log(id)

        $.ajax({
            type: 'DELETE',
            url: '/products/' + id,
            success: function (response) {
                alert('Deleting products')
                window.location.href = '/mainpage'
            },
            error: function (err) {
                console.error(err)
            }
        });
    })
})