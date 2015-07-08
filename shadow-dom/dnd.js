var Dnd = function()
{};

Dnd.prototype.init = function(domConfig, stateConfig, analyticsCallback, getTitleSnippet, dndCallback, fileUploadCallback, dropConfirmCallback)
{
  var dropZone    = domConfig.dropZone;
  var dndElement  = null;

  console.log('init ', domConfig);

  var $body = $("body");
  $body.on("dragstart", function(event)
  {
    dndElement = event.srcElement;

    if ($(dndElement).parent().is($("#mmTopBar")))
    {
      return;
    }

    $(dropZone).show();
  });

  // show dropzone when dragging in a file or content from another window
  $body.on("dragenter", function(event)
  {
     console.log('dragenter');
    $(dropZone).show();
  });

  // TODO need the opposite of dragenter here that doesn't screw everything up
  //  $body.on("dragleave", function(event)
  //  {
  //    $("#mmWindow #mmDropZone").hide();
  //    console.debug("In body#dragleave...");
  //  });

  $(dropZone).on("dragleave", function(event)
  {
    console.log('dragleave');
    event.preventDefault();
    event.stopPropagation();
    $(dropZone).removeClass("acquired");
  });

  // its necessary to handle dragover to accept DnDs
  $(dropZone).on("dragover", function(event)
  {
    console.log('dragover');
    event.preventDefault();
    event.stopPropagation();
    $(dropZone).addClass("acquired");
  });

  $(dropZone).on("drop", function(event)
  {
    console.log('drop');
    event.preventDefault();
    event.stopPropagation();

    var dataTransfer = event.originalEvent.dataTransfer;

    dnd.handleDrop(domConfig, stateConfig, 
                    dndElement, dataTransfer, 
                    dndCallback, fileUploadCallback, 
                    getTitleSnippet, analyticsCallback, dropConfirmCallback);
  });

  $body.on("dragend", function(event)
  {
    $(dropZone).removeClass("acquired");
    $(dropZone).hide();
    dndElement = null;
  });
};

Dnd.prototype.handleDrop = function(domConfig, stateConfig, dndElement, dataTransfer, dndCallback, fileUploadCallback, getTitleSnippet, analyticsCallback, dropConfirmCallback)
{
  var html      = dataTransfer.getData("text/html");
  var url       = dataTransfer.getData("text/uri-list");
  var files     = dataTransfer.files;

  // Print some dataTransfer properties
  console.log('Data Transfer properties');
  console.log('html: ', html);
  console.log('url: ', url);
  console.log('files: ', files);

 /* var snippet;

  if ((dndElement && dndElement.tagName === "IMG"))  // element will be null on file DnD
  {
    // fallback if dataTransfer does not work
    if (html === '')
    {
      var location = window.location;
      var $dndElement = $(dndElement);
      var srcURL = $dndElement.attr("src");

      // http://hostname/src/asset.jpg
      if (srcURL.match(/:/))
      {
        // do nothing
      }
      // //hostname/src/asset.jpg
      else if (srcURL.match(/^\/\/\w.*$/))
      {
        // do nothing
      }
      // /src/asset.jpg
      else if (srcURL.charAt(0) == '/')
      {
        $dndElement.attr("src", location.protocol + "//" + location.host + srcURL);
      }
      // src/asset.jpg
      else
      {
        $dndElement.attr("src", location.href + srcURL);
      }

      //snippet = snippetMaker.getDNDMixedHtml(titleSnippet, $dndElement.get(0).outerHTML);
      snippet = $dndElement.get().outerHTML;
    }
    else
    {
      if (url !== $(dndElement).attr("src"))
      {
        //snippet = snippetMaker.getDNDMixedHtml(titleSnippet, '<a href="' + url + '">' + html + '</a>');
        snippet = '<a href="' + url + '">' + html + '</a>';
      }
      else
      {
        //snippet = snippetMaker.getDNDMixedHtml(titleSnippet, html);
        snippet = html;
      }
    }
  }
  else if (files.length > 0)
  {
    $(domConfig.dropZone).hide();
    //dnd.upload(files, domConfig, stateConfig, fileUploadCallback, dropConfirmCallback);

    analyticsCallback("File");
    return;
  }
  else
  {
    //snippet = snippetMaker.getDNDMixedHtml(titleSnippet, html);
    snippet = html;
  }

  analyticsCallback(dndElement && dndElement.tagName ? dndElement.tagName.toUpperCase() : "Mixed HTML");

  var cite = window.location.href;
  if (snippet === '' || snippet === undefined || snippet === null)
  {
    snippet = '<a href="' + cite + '">' + cite + '</a>';
  }
  dndCallback("boardController", "postSnippet", [ snippet, cite, null ], dropConfirmCallback);
*/
};

// TODO Move this to the background.  And into attachments_controller.js
Dnd.prototype.upload = function(files, domConfig, stateConfig, fileUploadCallback, confirmDrop)
{
  console.debug("~~~~~ Uploading file " + files[0].name + " ~~~~~");
  
  console.debug(domConfig);
  console.debug(stateConfig);
  console.debug(fileUploadCallback);
  
  $('.directUpload').each(function()
  {
    var currentBoardId = stateConfig.currentBoard;
    var server = stateConfig.server;

    var form = $(this);

    // configure the fileupload plugin
    if (!$(this).hasClass('applied'))
    {
      $(this).addClass('applied').fileupload(
      {
        url: form.attr('action'),
        type: 'POST',
        autoUpload: true,
        dropZone: domConfig.dropZone,
        dataType: 'xml', // This is really important as s3 gives us back the url of the file in a XML document
        add: function(event, data)
        {
          $(domConfig.progressUI).append(snippetMaker.getProgressSnippet()).scrollTop(1000000);
          var filename = encodeURIComponent(data.files[0].name);
          var contentType = data.files[0].type;
          $.ajax(
          {
            url: server + "/api/v1/boards/" + currentBoardId + "/credentials?handle=" + stateConfig.currentUserHandle + "&token=" + stateConfig.currentUserToken,
            type: 'GET',
            dataType: 'json',
            data: {attachment: {filename: filename, type: contentType}}, // send the file name to the server so it can generate the key param
            async: false,
            success: function(data)
            {
              form.find('input[name=key]').val(data.key);
              form.find('input[name=policy]').val(data.policy);
              form.find('input[name=signature]').val(data.signature);
              form.find('input[name=Content-Type]').val(contentType);
            }
          });
          data.submit();
        },
        send: function(e, data)
        {
          $('.progress').fadeIn();
        },
        progress: function(e, data)
        {
          var percent = Math.round((e.loaded / e.total) * 100);
          $('.bar').css('width', percent + '%');
        },
        success: function(data)
        {
          var s3Url = decodeURIComponent($(data).find('Location').text());
          var filename = s3Url.substring(s3Url.lastIndexOf('/')+1);
          var filepath = s3Url.substring(0, s3Url.lastIndexOf('/')+1);
          var doubleEncodedS3FileUrl = filepath + encodeURIComponent(filename);
          var displayFilename = decodeURIComponent(filename);
          var contentType = filename.split('.').pop();

          //var snippet = snippetMaker.getDNDFile(doubleEncodedS3FileUrl, displayFilename, stateConfig.currentUserHandle);

          fileUploadCallback(doubleEncodedS3FileUrl, contentType, displayFilename);
        },
        done: function(event, data)
        {
          $('.progress').fadeOut(300, function()
          {
            $('.bar').css('width', 0);
            $('#directUploadContainer').remove();
            if ($.isFunction(confirmDrop))
            {
              confirmDrop();
            }
          });
        }
      });

      // invoke the configured fileupload plugin
      $(this).fileupload('add',
      {
        files: files
      });
    }
  });
};

var dnd = new Dnd();

