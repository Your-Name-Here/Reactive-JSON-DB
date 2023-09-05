// var blessed = require('blessed');
import { screen, box, list } from "blessed";
const TUI = screen({
    smartCSR: true
});
TUI.title = 'ReactiveDB';
const main = box({
    top: 'top',
    left: 'center',
    width: '100%',
    height: '100%',
    // content: 'Reactive {bold}DB{/bold} Manager!',
    label: ' ReactiveDB Manager ',
    tags: true,
    border: {
        type: 'line'
    },
    style: {
        fg: 'white',
        // bg: 'magenta',
        border: {
            fg: '#f0f0f0'
        },
        hover: {
            bg: 'green'
        }
    }
})

const Tables = box({
    top: 'top',
    width: '200',
    height: '100%-2',
    // content: 'Reactive {bold}DB{/bold} Manager!',
    label: ' Tables ',
    tags: true,
    border: {
        type: 'line'
    },
    style: {
        fg: 'white',
        border: {
            fg: '#f0f0f0'
        },
        hover: {
            bg: 'green'
        }
    }
})
const tablelist = list({
    parent: Tables,
    top: 'top',
    // width: '100%',
    // height: '100%',
    items: ['users', 'posts'],
})

main.append(Tables);
tablelist.focus();
const mainBox = box({
    parent: main,
    top: 'top',
    left: '201',
    // width: TUI.cols - 100,
    height: '100%-2',
    // content: 'Reactive {bold}DB{/bold} Manager!',
    label: ' Main ',
    tags: true,
    border: {
        type: 'line'
    },
    style: {
        fg: 'white',
        // bg: 'magenta',
        border: {
            fg: '#f0f0f0'
        },
        hover: {
            bg: 'green'
        }
    }
})
tablelist.on('select', function(el, selected) {
    mainBox.setContent('You selected: ' + selected);
    TUI.render();
});
console.log = function(...args) {
    mainBox.setContent(args.join(' '));
    TUI.render();
}
console.log('Hello World!')
console.log('Hello World 2!')
TUI.append(main);
TUI.render();
TUI.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0);
});
