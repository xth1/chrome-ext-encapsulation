(function() {
    var $Content = $Content || {};

    // Global variables
    $Content.widget = null; // the element :mammoth-mini-window:
    $Content.shadow = null; // the shadow dom


    // Loads dinamically the css file
    $Content.loadHTML = function(callback_func) {
        jQuery.get(chrome.extension.getURL('mm_window.html'), function(data) {
           var html_data = data + "";
           callback_func(html_data);
        });
    }

    // Loads dinamically the css file
    $Content.loadCSS = function(callback_func) {
        jQuery.get(chrome.extension.getURL('window.css'), function(data) {
           var css_data = "<style>" + data + "</style>";
           callback_func(css_data);
        });
    }

    // Create the extension widget using a custom element :mammoth-mini-window:
    $Content.createWidget = function(html_data, css_data) {
        this.widget = document.createElement(':mammoth-mini-window:');

        this.shadow = this.widget.createShadowRoot ? this.widget.createShadowRoot() :
                                               this.widget.webkitCreateShadowRoot();
        // inject the css data in the widget's shadow
        $(this.shadow).html(css_data);
        // append the window to the widget's shadow
        $(this.shadow).append($(html_data));
    }

    $Content.queryShadow = function(query) {
        var elm = $Content.shadow.querySelector(query);
        return elm;
    }


    // Init the content script as soon the host pages loads
    $(function() {
        $Content.loadCSS(function(css_data) {
            $Content.loadHTML(function(html_data) {
                $Content.createWidget(html_data, css_data);
                $('body').append($Content.widget);

                // Aparently Jquery Can be used to query in the shadow dom
                var elm = $Content.queryShadow("a[data-action='closeButtonClicked']");
                
                // Set the close event handler
                $(elm).click(function() {
                    var elm = $($Content.queryShadow("#mmWindow"));
                    $(elm).hide();
                    return false;
                });

                // Init the dropping area
                var drop_area = $($Content.queryShadow("#drop-area"));
                var domc = {};
                domc.dropZone = drop_area
                dnd.init(domc);

            });
        });
    });
})();
