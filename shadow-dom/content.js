(function() {
    var $Content = $Content || {};

    // Global variables
    $Content.widget = null; // the element :mammoth-mini-window:
    $Content.shadow = null; // the shadow dom

    // Build the app window
    $Content.buildWindow = function() {
        var box = $("<div id='mmWindow'>");
        box.append($('<h1>Title 1</h1>'));
        box.append($('<h2>Title 2</h2>'));
        box.append($('<h3>Title 3</h3>'));

        var button = $("<a>");
        $(button).html('close');
        $(button).attr('id', 'close_button');
        $(button).attr('href', '#');
        
        $(box).append(button);
        return $(box).get(0);
    }

    // Loads dinamically the css file
    $Content.loadCSS = function(callback_func) {
        jQuery.get(chrome.extension.getURL('window.css'), function(data) {
           var css_data = "<style>" + data + "</style>";
           callback_func(css_data);
        });
    }

    // Create the extension widget using a custom element :mammoth-mini-window:
    $Content.createWidget = function(css_data) {
        this.widget = document.createElement(':mammoth-mini-window:');

        this.shadow = this.widget.createShadowRoot ? this.widget.createShadowRoot() :
                                               this.widget.webkitCreateShadowRoot();
        // inject the css data in the widget's shadow
        $(this.shadow).html(css_data);
        // append the window to the widget's shadow
        this.shadow.appendChild(this.buildWindow());
    }

    // Init the content script as soon the host pages loads
    $(function() {
        $Content.loadCSS(function(css_data) {
            $Content.createWidget(css_data);
            $('body').append($Content.widget);

            // Aparently Jquery Can be used to query in the shadow dom
            var elm = $Content.shadow.querySelector('#close_button');
            // Set the close event handler
            $(elm).click(function() {
                $($Content.widget).hide();
            });
        });
    });
})();
