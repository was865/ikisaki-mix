$(function() {

    // Downlistメニュー
    $('.header-left h1 span').click(function(){
        if ($('ul').hasClass('open')) {
            $(this).html('<i class="fa fa-bars" aria-hidden="true"></i>');
            $('ul').slideUp().removeClass('open');
        } else {
            $('ul').slideDown().addClass('open');
            $(this).html('<i class="fa fa-chevron-down" aria-hidden="true"></i>');
        }
    });

    // 社員新規登録モーダル
    $('#create_user').click(function() {
        $('#signup-modal').fadeIn();
        $('ul').hide().removeClass('open');
        $('.header-left h1 span').html('<i class="fa fa-bars" aria-hidden="true"></i>');
    });
    $('#close-modal').click(function() {
        $('#signup-modal').fadeOut();
    });
    // admin登録判定
    $('#newadmin_check_btn').click(function(){
        if ($(this).hasClass('Isadmin')){
            $(this).removeClass('Isadmin').children('i').attr('class','fas fa-user');
            $('#adduser-form h2').text('社員新規登録');
            $('#create_name').attr('placeholder','名前');
            $('#btn_newuser').css({
                'background-color': '#56bed8'
            });
            $('#form_newuser_info').html('<span style="color: red;">※</span>氏名欄のアイコンをクリックすると管理者を登録できます。');
            
            $('#newadmin_check_body').val('0');
            console.log('新規管理者判定: ' + $('#newadmin_check_body').val());
        } else {
            $(this).addClass('Isadmin').children('i').attr('class','fas fa-user-shield');
            $('#adduser-form h2').text('管理者新規登録');
            $('#create_name').attr('placeholder','名前 (admin)')
            $('#btn_newuser').css({
                'background-color': '#ff9f4f'
            });
            $('#form_newuser_info').html('<span style="color: red;">※</span>再度アイコンをクリックすると社員登録に戻ります。');

            $('#newadmin_check_body').val('1');
            console.log('新規管理者判定: ' + $('#newadmin_check_body').val());
        }
    });

    $('#newadmin_check_btn i').hover(function(){
        if ($('#newadmin_check_btn').hasClass('Isadmin')){
            $(this).css('color', '#e7853e');
        }else {
            $(this).css('color', '#33b4d4');
        }
    },function(){
        if ($('#newadmin_check_btn').hasClass('Isadmin')){
            $(this).css('color', '#ff9f4f');
        }else {
            $(this).css('color', '');
        }
    });


    $('#btn_newuser').hover(function(){
        if ($('#newadmin_check_btn').hasClass('Isadmin')){
            $(this).css('background-color', '#e7853e');
        }else {
            $(this).css('background-color', '#33b4d4');
        }
    },function(){
        if ($('#newadmin_check_btn').hasClass('Isadmin')){
            $(this).css('background-color', '#ff9f4f');
        }else {
            $(this).css('background-color', '');
        }
    });


    // 新規客先登録モーダル
    $('#create_kyakusaki').click(function() {
        $('#form_newkyakusaki').children().children('input[name="kyakusaki"]').parent().show();
        $('ul').hide().removeClass('open');
        $('.header-left h1 span').html('<i class="fa fa-bars" aria-hidden="true"></i>');
        $('#addkyakusaki-modal').fadeIn();
    });
    $('#close-modal2').click(function() {
        $('#addkyakusaki-modal').fadeOut();
    });

    // 新規社内登録モーダル
    $('#create_shanai').click(function() {
        $('#form_newshanai').children().children('input[name="shanai"]').parent().show();
        $('ul').hide().removeClass('open');
        $('.header-left h1 span').html('<i class="fa fa-bars" aria-hidden="true"></i>');
        $('#addshanai-modal').fadeIn();
    });
    $('#close-modal3').click(function(){
        $('#addshanai-modal').fadeOut();
    });

    // 基本情報変更モーダル
    $('#change_userinfo').click(function() {
        $('ul').hide().removeClass('open');
        $('.header-left h1 span').html('<i class="fa fa-bars" aria-hidden="true"></i>');
        $('#userinfo-modal').fadeIn();
    });
    $('#close-modal4').click(function(){
        $('#userinfo-modal').fadeOut();
        $('#userinfo_newpassword').val('').attr('placeholder','新しいパスワード（入力しない場合無変更）');
        $('#userinfo_newpassword_tmp').val('').attr('placeholder','新しいパスワードを確認').hide();
    });

    //部署管理モーダル
    $('#create_department').click(function() {
        $('#form_newdepartment').children().children('input[name="department"]').parent().show();
        $('ul').hide().removeClass('open');
        $('.header-left h1 span').html('<i class="fa fa-bars" aria-hidden="true"></i>');
        $('#adddepartment-modal').fadeIn();
    });
    $('#close-modal5').click(function() {
        $('#adddepartment-modal').fadeOut();
    });


    //ユーザー管理 ul i
    $('#manage_users').click(function() {
        window.location.href = '/manage';
    });


    // 社員新規入力passwordチェック
    $('#btn_newuser').click(function(){
        if ($('#create_name').val() == '' || $('#select_create_department').val() == '' || $('#create_password').val() == '' || $('#tmp_password').val() == '') {
            alert('\n名前、所属、パスワードは必ず入力してください！');
            return false;
        } else if ($('#create_password').val() != $('#tmp_password').val()) {
            $('#create_password').val('');
            $('#tmp_password').val('');
            $('#create_password').attr('placeholder','入力が一致しません。');
            $('#tmp_password').attr('placeholder','パスワードを確認してください。');
            return false;
        } else {
            //正規表現パターン（半角英数......に一致）
            var regex = new RegExp(/^(?=.*?[a-z])(?=.*?\d)[a-z\d]{6,20}$/i);
            
            //判定する文字列
            var str = $('#create_password').val();
            
            //判定
            if (regex.test(str)) {
                return true;
            } else {
                alert("6文字以上20文字以内の半角英数字混在のものを設定してください。");
                $('#create_password').val('');
                $('#tmp_password').val('');
                return false;
            }
            
        }
    });

    $('.placeholder_select').change(function() {
        $(this).css('color','black');
    })

    // 基本情報変更passwordチェック
    $('#userinfo_newpassword_tmp').hide();
    $('#userinfo_newpassword').keypress(function(){
        $('#userinfo_newpassword_tmp').show();
    });
    $('#btn_newuserinfo').click(function(){
        if ($('#userinfo_name').val() == '' || $('#userinfo_department').val() == '') {
            alert('\n名前と所属は必ず入力してください！');
            return false;
        } else if ($('#userinfo_newpassword').val() == '' && $('#userinfo_newpassword_tmp').val() == '') {
            alert('\n情報変更できました！\n\nログインし直してください。');
            return true;
        } else if ($('#userinfo_newpassword').val() != $('#userinfo_newpassword_tmp').val()) {
            $('#userinfo_newpassword').val('');
            $('#userinfo_newpassword_tmp').val('');
            $('#userinfo_newpassword').attr('placeholder','入力が一致しません。');
            $('#userinfo_newpassword_tmp').attr('placeholder','パスワードを確認してください。');
            return false;
        } else {

            //正規表現パターン（半角英数......に一致）
            var regex = new RegExp(/^(?=.*?[a-z])(?=.*?\d)[a-z\d]{6,20}$/i);
                        
            //判定する文字列
            var str = $('#userinfo_newpassword').val();

            //判定
            if (regex.test(str)) {
                alert('\n情報変更できました！\n\nログインし直してください。');
                return true;
            } else {
                alert("6文字以上20文字以内の半角英数字混在のものを設定してください。");
                $('#userinfo_newpassword').val('');
                $('#userinfo_newpassword_tmp').val('');
                return false;
            }

            
        }
    });

    //客先追加INPUTBOXをclone
    var minCount = 1;
    var maxCount = 7;

    $('#btn_kyakusaki_add').on('click', function(){
        var inputCount = $('div.clone_newkyakusaki').length;
        if (inputCount < maxCount){
            $('div#clone_newkyakusaki')
            .clone(true)
            .removeAttr('id')
            .removeClass('hide')
            .children('input').attr('name','newkyakusaki')
            .end()
            .appendTo('#clonearea_newkyakusaki')
        }
    });
    $('#btn_kyakusaki_add').hover(function(){
        $(this).animate({fontSize: '25px'},0);
    },function(){
        $(this).animate({fontSize: '15px'},100);
    });

    $('.btn_kyakusaki_minus').on('click', function(){

        var inputCount = $('div.clone_newkyakusaki').length;
        if (inputCount > minCount){
            $(this).parent('span').parent('div').remove();
        }
        
    });

    $('.btn_kyakusaki_delete').on('click', function(){
        $(this).parent().parent().children('input[name="kyakusaki"]').end().slideUp();
    });
    $('.btn_kyakusaki_delete').hover(function(){
        $(this).animate({fontSize: '15px'},0);
    },function(){
        $(this).animate({fontSize: '15px'},100);
    });

    $('#btn_newkyakusaki').on('click', function(){
        var data = '';
        $('#form_newkyakusaki').children().children('input[name="kyakusaki"]').parent().each(function(){
            if ($(this).is(':hidden')){
                data += $(this).children('input[name="kyakusaki"]').val() + '，';
                $(this).children('input[name="kyakusaki"]').val('');
            }
        })
        if (data != ''){
            if(!confirm('\n"' + data.slice(0,-1) + '"は削除されます。\nよろしいですか？')){
                window.location.href = '/';
                return false;
            } else {
                return true;
            }
        }
    })

    //社内追加INPUTBOXをclone
    var minCount_shanai = 1;
    var maxCount_shanai = 5;

    $('#btn_shanai_add').on('click', function(){
        var inputCount = $('div.clone_newshanai').length;
        if (inputCount <= maxCount_shanai){
            $('div#clone_newshanai')
            .clone(true)
            .removeAttr('id')
            .removeClass('hide')
            .children('input').attr('name','newshanai')
            .end()
            .appendTo('#clonearea_newshanai')
        }
    });
    $('#btn_shanai_add').hover(function(){
        $(this).animate({fontSize: '25px'},0);
    },function(){
        $(this).animate({fontSize: '15px'},100);
    });

    $('.btn_shanai_minus').on('click', function(){
        var inputCount = $('div.clone_newshanai').length;
        if (inputCount > minCount_shanai){
            $(this).parent('span').parent('div').remove();
        }
    });

    $('.btn_shanai_delete').on('click', function(){
        $(this).parent().parent().children('input[name="shanai"]').end().slideUp();
    });
    $('#btn_newshanai').on('click', function(){
        var data = '';
        $('#form_newshanai').children().children('input[name="shanai"]').parent().each(function(){
            if ($(this).is(':hidden')){
                data += $(this).children('input[name="shanai"]').val() + '，';
                $(this).children('input[name="shanai"]').val('');
            }
        })
        if (data != ''){
            if(!confirm('\n"' + data.slice(0,-1) + '"は削除されます。\nよろしいですか？')){
                window.location.href = '/';
                return false;
            } else {
                return true;
            }
        }
    })

    //部署追加INPUTBOXをclone
    var minCount = 1;
    var maxCount = 7;

    $('#btn_department_add').on('click', function(){
        var inputCount = $('div.clone_newdepartment').length;
        if (inputCount < maxCount){
            $('div#clone_newdepartment')
            .clone(true)
            .removeAttr('id')
            .removeClass('hide')
            .children('input').attr('name','newdepartment')
            .end()
            .appendTo('#clonearea_newdepartment')
        }
    });
    $('#btn_department_add').hover(function(){
        $(this).animate({fontSize: '25px'},0);
    },function(){
        $(this).animate({fontSize: '15px'},100);
    });

    $('.btn_department_minus').on('click', function(){

        var inputCount = $('div.clone_newdepartment').length;
        if (inputCount > minCount){
            $(this).parent('span').parent('div').remove();
        }
        
    });

    $('.btn_department_delete').on('click', function(){
        $(this).parent().parent().children('input[name="department"]').end().slideUp();
    });
    $('.btn_department_delete').hover(function(){
        $(this).animate({fontSize: '15px'},0);
    },function(){
        $(this).animate({fontSize: '15px'},100);
    });

    $('#btn_newdepartment').on('click', function(){
        var data = '';
        $('#form_newdepartment').children().children('input[name="department"]').parent().each(function(){
            if ($(this).is(':hidden')){
                data += $(this).children('input[name="department"]').val() + '，';
                $(this).children('input[name="department"]').val('');
            }
        })
        if (data != ''){
            if(!confirm('\n"' + data.slice(0,-1) + '"は削除されます。\nよろしいですか？')){
                window.location.href = '/';
                return false;
            } else {
                return true;
            }
        }
    });

    //logout
    $('#logout').click(function(){
        window.location.href = '/logout';
    });

});