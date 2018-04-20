$(function() {
    if (!ClipboardJS.isSupported()) return;

    var timer;
    function restoreAfter(elem, timeout) {
        function work() {
            elem.attr('src', '/images/clippy.svg').attr('alt', 'Copy to clipboard');
        }
        if (timer) {
            clearTimeout(timer.timeout);
            timer.work();
        }
        timer = {
            work: work,
            timeout: setTimeout(work, timeout)
        };
    }

    $('pre.highlight').each(function (i, elem) {
        elem.firstChild.insertAdjacentHTML('beforebegin','<button class="btn" data-clipboard-snippet><img class="clippy" width="13" src="/images/clippy.svg" alt="Copy to clipboard"></button>');
    });
    var clipboardSnippets = new ClipboardJS('[data-clipboard-snippet]', {
        target: function (trigger) {
            return trigger.nextElementSibling;
        }
    });
    clipboardSnippets.on('success', function (e) {
        e.clearSelection();
        var trigger = $(e.trigger);
        var elem = $('img', trigger);
        elem.attr('src', '/images/check.svg').attr('alt', 'Copied!');
        trigger.blur(function() {
            setTimeout(function () {
                elem.attr('src', '/images/clippy.svg').attr('alt', 'Copy to clipboard');
            }, 300);
        });
    });
    clipboardSnippets.on('error', function (e) {
        var trigger = $(e.trigger);
        var elem = $('img', trigger);
        elem.attr('src', '/images/x.svg').attr('alt', 'Unable to copy');
        trigger.blur(function() {
            setTimeout(function () {
                elem.attr('src', '/images/clippy.svg').attr('alt', 'Copy to clipboard');
            }, 300);
        });
    });

});
