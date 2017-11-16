function north() {
    $.get('/move?x=0&y=-1', (data) => {
        $("#result").text(data);
    })
}

function south() {
    $.get('/move?x=0&y=1', (data) => {
        $("#result").text(data);
    })
}

function west() {
    $.get('/move?x=-1&y=0', (data) => {
        $("#result").text(data);
    })
}

function east() {
    $.get('/move?x=1&y=0', (data) => {
        $("#result").text(data);
    })
}

function search() {
    $.get('/search', (data) => {
        $("#result").text(data);
    })
}

function atk() {
    $.get('/atk', (data) => {
        $("#result").text(data);
    })
}

function collect() {
    $.get('/collect', (data) => {
        $("#result").text(data);
    })
}

$("body").keydown(function (event) {
    // event.preventDefault();
    // console.log(event.key);
    switch (event.key) {
        case 'ArrowUp':
            return north();
        case 'ArrowDown':
            return south();
        case 'ArrowLeft':
            return west();
        case 'ArrowRight':
            return east();
        case 'a':
            return atk();
        case 's':
            return search();
        case 'c':
            return collect();
    }
});