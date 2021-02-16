$(function($){
    //Ctrlキー+spaceキー
    var hover = 1;
    $(window).keydown(function(e){
        if(event.ctrlKey){
            if(e.keyCode === 32){
                var disableFileName = "index_hover.css"; // 無効にするcssのファイル名
                if (hover == 1){
                    for(var i = 0; i < document.styleSheets.length; i++) {
                        // ファイルパス（フルパス）
                        var styleSheetPath = document.styleSheets[i].href;
                        // フルパスからファイル名を抽出
                        var fileName = styleSheetPath.substring(styleSheetPath.lastIndexOf('/')+1, styleSheetPath.length);
                        if (fileName === disableFileName) {
                            // 無効にするファイル名なので無効にする
                            document.styleSheets[i].disabled = true;
                            hover = 0;
                            alert("hoverを無効化しました。");
                        }
                    }  
                } else {
                    for(var i = 0; i < document.styleSheets.length; i++) {
                        // ファイルパス（フルパス）
                        var styleSheetPath = document.styleSheets[i].href;
                        // フルパスからファイル名を抽出
                        var fileName = styleSheetPath.substring(styleSheetPath.lastIndexOf('/')+1, styleSheetPath.length);
                        if (fileName === disableFileName) {
                            // 無効にするファイル名なので無効にする
                            document.styleSheets[i].disabled = false;
                            hover = 1;
                            alert("hoverを有効にしました。");
                        }
                    }  
                }
            return false;
            }
      }
    });

});