// script Toggle
$(document).ready(function () {
    $('#sidebarCollapse').on('click', function () {
        $('#sidebar').toggleClass('active');
        $(this).toggleClass('active');
    });
});
// fim script Toggle

// script Tooltip
$(document).ready(function () {
    $('[data-toggle="tooltip"]').tooltip();
})
// fim script Tooltip

// Script Popover
$(document).ready(function(){
    $('[data-toggle="popover"]').popover();
});

$(document).ready(function () {
    $("[data-toggle=popover]")
    .popover({html:true})
})
// fim script Popover

// scripts mensagens alertas
$(".b-incluir").click(function(){
    $('#msg-inclusao').removeClass('d-none')
});

$(".close-inclusao").click(function(){
    $('#msg-inclusao').addClass('d-none')
});

$(".close-cadastro").click(function(){
    $('#msg-cadastro').addClass('d-none')
});

$(".b-cadastro").click(function(){
    $('#msg-cadastro').removeClass('d-none')
});

$(".close-error").click(function(){
    $('#msg-input-error').addClass('d-none')
});
// fim scripts mensagens alertas

// inicializando select(combo-box)
$(document).ready(function() {
    $('select').niceSelect();
});
// fim inicializando select(combo-box)

// script datepicker
$('.form_date').datetimepicker({
    language:  'pt-BR',
    autoclose: 1,
    minView: 2,
    format: "dd/mm/yyyy"
});
// fim script datepicker

// script add contato
$("#radio_no").click(function(){
    $('#endereco-entrega').removeClass('d-none')
});
$("#radio_yes").click(function(){
    $('#endereco-entrega').addClass('d-none')
});

// Unidade de Negócio
$('.btn-adicionar').click(function(){
    $('.b-contato').removeClass('d-none')
    $('.btn-adicionar-2').removeClass('d-none')
    $('.btn-adicionar').addClass('d-none')
    var telValue = $('#telefone-add').val()
    var emailValue = $('#email-add').val()
    $('.t-contato tbody .tr-1 td.tel').append(telValue)
    $('.t-contato tbody .tr-1 td.email').append(emailValue)
});

$('.btn-adicionar-2').click(function(){
    $('.btn-adicionar-2').addClass('d-none')
    $('.btn-adicionar-3').removeClass('d-none')
    var telValue = $('#telefone-add').val()
    var emailValue = $('#email-add').val()
    $('.t-contato tbody .tr-2 td.tel').append(telValue)
    $('.t-contato tbody .tr-2 td.email').append(emailValue)
    $('.tr-2').removeClass('d-none')
});

$('.btn-adicionar-3').click(function(){
    var telValue = $('#telefone-add').val()
    var emailValue = $('#email-add').val()
    $('.t-contato tbody .tr-3 td.tel').append(telValue)
    $('.t-contato tbody .tr-3 td.email').append(emailValue)
    $('.tr-3').removeClass('d-none')
});
// Fim Unidade de Negócio

// Fornecedor Contato
$('.btn-adicionar').click(function(){
    $('.b-contato').removeClass('d-none')
    $('.btn-adicionar-2').removeClass('d-none')
    $('.btn-adicionar').addClass('d-none')
    var telValue = $('#telefone-add').val()
    var emailValue = $('#email-add').val()
    $('.t-contato-2 tbody .tr-contato-1 td.tel').append(telValue)
    $('.t-contato-2 tbody .tr-contato-1 td.email').append(emailValue)
});

$('.btn-adicionar-2').click(function(){
    $('.btn-adicionar-2').addClass('d-none')
    $('.btn-adicionar-3').removeClass('d-none')
    var telValue = $('#telefone-add').val()
    var emailValue = $('#email-add').val()
    $('.t-contato-2 tbody .tr-contato-2 td.tel').append(telValue)
    $('.t-contato-2 tbody .tr-contato-2 td.email').append(emailValue)
    $('.tr-contato-2').removeClass('d-none')
    $('.s-contato-1').removeClass('d-none')
});

$('.btn-adicionar-3').click(function(){
    var telValue = $('#telefone-add').val()
    var emailValue = $('#email-add').val()
    $('.t-contato-2 tbody .tr-contato-3 td.tel').append(telValue)
    $('.t-contato-2 tbody .tr-contato-3 td.email').append(emailValue)
    $('.tr-contato-3').removeClass('d-none')
    $('.s-contato-2').removeClass('d-none')
    $('.s-contato-3').removeClass('d-none')
});
// Fim Fornecedor Contato

$(".excluir").click(function() {
    $(this).parents('tr').remove();
});

$("#btn-busca-lista").click(function(){
    $("#conteudo-contato-2").toggleClass("d-none");
});

$("#btn-close-lista").click(function(){
    $("#conteudo-contato-2").toggleClass("d-none");
});

$("#btn-busca-lista-2").click(function(){
    $("#conteudo-marcas-fornecedores-2").toggleClass("d-none");
});

$("#btn-close-lista-2").click(function(){
    $("#conteudo-marcas-fornecedores-2").toggleClass("d-none");
});


// fim script add contato