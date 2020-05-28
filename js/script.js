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

// Marcas e Fornecedores
$('.bt-add').click(function(){
    $('#conteudo-marcas-fornecedores').removeClass('d-none')
    $('.bt-add').addClass('d-none')
    $('.bt-add-2').removeClass('d-none')
    var selectMf = $('#add-mf :selected').text();
    var dateValue = new Date();
    var day = dateValue.getDay()
    var date = dateValue.getDate()
    var mes =  dateValue.getMonth()
    var ano =  dateValue.getFullYear()
    var horas =  dateValue.getHours()
    var minutos =  dateValue.getMinutes()
    $('.lista-mf tbody .tr-1 td.mf').append(selectMf)
    $('.lista-mf tbody .tr-1 td.date-mf').append(date +'/'+ day +'/'+ ano);
});

$('.bt-add-2').click(function(){
    $('.bt-add-2').addClass('d-none')
    $('.bt-add-3').removeClass('d-none')
    $('.lista-mf tbody .tr-2').removeClass('d-none')
    var selectMf = $('#add-mf :selected').text();
    var dateValue = new Date();
    var day = dateValue.getDay()
    var date = dateValue.getDate()
    var mes =  dateValue.getMonth()
    var ano =  dateValue.getFullYear()
    var horas =  dateValue.getHours()
    var minutos =  dateValue.getMinutes()
    $('.lista-mf tbody .tr-2 td.mf').append(selectMf)
    $('.lista-mf tbody .tr-2 td.date-mf').append(date +'/'+ day +'/'+ ano);
    $('.s-mf-1').removeClass('d-none')
});

$('.bt-add-3').click(function(){
    $('.bt-add-3').addClass('d-none')
    $('.bt-add').removeClass('d-none')
    $('.lista-mf tbody .tr-3').removeClass('d-none')
    var selectMf = $('#add-mf :selected').text();
    var dateValue = new Date();
    var day = dateValue.getDay()
    var date = dateValue.getDate()
    var mes =  dateValue.getMonth()
    var ano =  dateValue.getFullYear()
    var horas =  dateValue.getHours()
    var minutos =  dateValue.getMinutes()
    $('.lista-mf tbody .tr-3 td.mf').append(selectMf)
    $('.lista-mf tbody .tr-3 td.date-mf').append(date +'/'+ day +'/'+ ano);
    $('.s-mf-2').removeClass('d-none')
    $('.s-mf-3').removeClass('d-none')
});
// Fim Marcas e Fornecedores

// Especialidades
$('.bt-add-e').click(function(){
    $('#conteudo-especialidades').removeClass('d-none')
    $('.bt-add-e').addClass('d-none')
    $('.bt-add-e-2').removeClass('d-none')
    var selectE = $('#add-e :selected').text();
    var dateValue = new Date();
    var day = dateValue.getDay()
    var date = dateValue.getDate()
    var mes =  dateValue.getMonth()
    var ano =  dateValue.getFullYear()
    var horas =  dateValue.getHours()
    var minutos =  dateValue.getMinutes()
    $('.lista-e tbody .tr-1 td.especialidade').append(selectE)
    $('.lista-e tbody .tr-1 td.date-esp').append(date +'/'+ day +'/'+ ano);
});

$('.bt-add-e-2').click(function(){
    $('.bt-add-e-2').addClass('d-none')
    $('.bt-add-e-3').removeClass('d-none')
    $('.lista-e tbody .tr-2').removeClass('d-none')
    var selectE = $('#add-e :selected').text();
    var dateValue = new Date();
    var day = dateValue.getDay()
    var date = dateValue.getDate()
    var mes =  dateValue.getMonth()
    var ano =  dateValue.getFullYear()
    var horas =  dateValue.getHours()
    var minutos =  dateValue.getMinutes()
    $('.lista-e tbody .tr-2 td.especialidade').append(selectE)
    $('.lista-e tbody .tr-2 td.date-esp').append(date +'/'+ day +'/'+ ano);
});

$('.bt-add-e-3').click(function(){
    $('.bt-add-e-3').addClass('d-none')
    $('.bt-add-e').removeClass('d-none')
    $('.lista-e tbody .tr-3').removeClass('d-none')
    var selectE = $('#add-e :selected').text();
    var dateValue = new Date();
    var day = dateValue.getDay()
    var date = dateValue.getDate()
    var mes =  dateValue.getMonth()
    var ano =  dateValue.getFullYear()
    var horas =  dateValue.getHours()
    var minutos =  dateValue.getMinutes()
    $('.lista-e tbody .tr-3 td.especialidade').append(selectE)
    $('.lista-e tbody .tr-3 td.date-esp').append(date +'/'+ day +'/'+ ano);
});
// Fim Especialidades
$('#btn-add-associacoes').click(function(){
    $('#conteudo-associacoes').removeClass('d-none')
});
$('#btn-busca-lista-assoc').click(function(){
    $('#conteudo-associacoes-2').toggleClass('d-none')
});
$('#btn-close-lista-assoc').click(function(){
    $('#conteudo-associacoes-2').toggleClass('d-none')
});

$('.busca-assoc').click(function(){
    $('#conteudo-associacoes').removeClass('d-none')
});


$('#btn-add-especialidades').click(function(){
    $('#conteudo-especialidades').removeClass('d-none')
});
$('#btn-busca-lista-especi').click(function(){
    $('#conteudo-especialidade-2').toggleClass('d-none')
});
$('#btn-close-lista-especi').click(function(){
    $('#conteudo-especialidade-2').toggleClass('d-none')
});


$('#btn-add-procedimentos').click(function(){
    $('#conteudo-procedimentos').removeClass('d-none')
});
$('#btn-busca-lista-proce').click(function(){
    $('#conteudo-procedimentos-2').toggleClass('d-none')
});
$('#btn-close-lista-proce').click(function(){
    $('#conteudo-procedimentos-2').toggleClass('d-none')
});


$('#reutilizavel-sim').click(function(){
    $('.n-reutilizavel').removeClass('d-none')
});

$('#reutilizavel-nao').click(function(){
    $('.n-reutilizavel').addClass('d-none')
});

$('#reanalise-sim').click(function(){
    $('.n-reanalise').removeClass('d-none')
});

$('#reanalise-nao').click(function(){
    $('.n-reanalise').addClass('d-none')
});
// Itens 

// Fim Itens 

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

// carregando divs do select
$(function() { //onload aqui
    $('#opcoes').on('change', function() {
      $('.sel').hide();
      let idSelecionado = $(this).val(); //construir o id
      if (idSelecionado != "") $("#" + idSelecionado).show(); //mostrar o elemento
    });
  
    $('#opcoes').trigger("change"); //aplicar a lógica do change
  })
  // fim carregando divs do select
  

  // inputs animado
  $(window, document, undefined).ready(function() {

    $('input').blur(function() {
      var $this = $(this);
      if ($this.val())
        $this.addClass('used');
      else
        $this.removeClass('used');
    });
  
    var $ripples = $('.ripples');
  
    $ripples.on('click.Ripples', function(e) {
  
      var $this = $(this);
      var $offset = $this.parent().offset();
      var $circle = $this.find('.ripplesCircle');
  
      var x = e.pageX - $offset.left;
      var y = e.pageY - $offset.top;
  
      $circle.css({
        top: y + 'px',
        left: x + 'px'
      });
  
      $this.addClass('is-active');
  
    });
  
    $ripples.on('animationend webkitAnimationEnd mozAnimationEnd oanimationend MSAnimationEnd', function(e) {
        $(this).removeClass('is-active');
    });
  
  });
  // fim Inputs animado

  $(".buscar-item").click(function(){
    $(".tabela-busca-item").toggleClass("d-none");
});

$(".mostrar-itens-section").click(function(){
    $(".tabela-busca-item").toggleClass("d-none");
    $(".show-itens-sections").toggleClass("d-none");
});


// marcar todos checkbox
function marcarTodos(marcardesmarcar){
    $('.marcar').each(function () {
        this.checked = marcardesmarcar;
    });
}