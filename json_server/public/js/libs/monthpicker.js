/**
 * Month Picker v2.0 (jQuery Plugins)
 *
 * @author Timmy Tin (ycTIN)
 * @license GPL
 * @version 2.0
 * @copyright Timmy Tin (ycTIN)
 * @website http://project.yctin.com/monthpicker
 *
 */
jQuery.fn.monthpicker = function(opts,callback){

    if (typeof opts == "function") {
        opts.onChanged = opts;
    } else {
    
        if (typeof opts == "string") {
            var s = opts.split('-');
            opts = {
                elements: [{
                    tpl: 'year',
                    opt: {
                        value: parseInt(s[0])
                    }
                }, {
                    tpl: 'month',
                    opt: {
                        value: parseInt(s[1])
                    }
                }]
            };
        }
        
        if (typeof callback == "function") {
            opts.onChanged = callback;
        }
    }

    opts = jQuery.extend({ //default
        elements: [{
            tpl: 'year'
        }, {
            tpl: 'month'
        }],
        
        onChanged: false
    
    }, opts);


    var templates = jQuery.extend({
        year: {
            key: 'year',
            type: 'dropdown',
            caption: 'Année',
            range: '-10~0',
            value: new Date().getFullYear()
        },
        month: {
            key: 'month',
            type: 'button',
            caption: 'Mois',
            text: ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jui', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'],
            range: '1~12',
            value: new Date().getMonth() + 1
        },
        quarter: {
            key: 'quarter',
            type: 'button',
            caption: 'Quarter',
            text: ['Q1', 'Q2', 'Q3', 'Q4'],
            range: '1~4',
            value: 1
        }
    }, opts.templates);

	return this.each(function(){

		var $container = jQuery(this);
		var $body = jQuery("<tr></tr>");
		var currentValue = {};
		
		for(var i = 0; i < opts.elements.length; i++) {
			add(opts.elements[i]);
		}
		
		jQuery("<table></table>").append($body).appendTo($container.html(""));
		
		return this;
	
		function toArray(str,cur) {
			if (str.indexOf('~') == -1) { return [cur]; }

			var sY,eY,y=str.split("~");
				
			if (y[0].charAt(0) == '-' || y[1].charAt(0) == '+') {
				sY = cur + parseInt(y[0], 10);
				eY = cur + parseInt(y[1], 10);
			} else if (y[0].match(/^\d*$/) && y[1].match(/^\d*$/)) {
				sY = parseInt(y[0], 10);
				eY = parseInt(y[1], 10);
			} else {
				return [cur];
			}
			
			var p=0, o=new Array;
			for (var i = sY; i <= eY; i++) { o[p++]=i; }
			return o;
		}
		function add(element) {		
			eval("var tpl = templates." + (element.tpl));

			if (!tpl) { return false; }

    		tpl = jQuery.extend(tpl, element.opt);
			
			set(tpl.key,tpl.value);
			
			var range = toArray(tpl.range,tpl.value);
			var text = (tpl.text || range);
			var className = '';
			
			if (tpl.type == "dropdown") {

				var $list = jQuery('<ul><li class="li"><!--[if IE 6]><a class="li" href="javascript:;"><table><tr><td><![endif]--><a href="javascript:;" ><span class="selected">' + tpl.value + '</span></a><ul></ul><!--[if IE 6]></td></tr></table></a><![endif]--></li></ul>');
				var $items = $list.find('ul');	
	
				for (var i = 0; i < range.length; i++) {
					
					className = (tpl.value == range[i]) ? "selected" : "";
					
					jQuery('<li class="li"></li>').append(
						jQuery('<a href="javascript:;" title="' + range[i] + '" class="' + className + '">' + text[i] + '</a>').click(function(){
							
							var $this = jQuery(this);
							var value = $this.attr('title');
							var $menu = $this.parent().parent();
							
							$menu.slideUp(0).show(1).parent().find('.selected:first').html(value);
							$menu.find('a').removeClass('selected');
							$this.addClass('selected');
							
							update(tpl.key,value,this);
							
						})
					).appendTo($items);
				}
				
				$body.append('<th class="caption">' + tpl.caption + '</th>').append(jQuery("<td></td>").append($list));
	
			} else if (tpl.type == "button") {	
			
				var $items = jQuery('<td class="month"></td>');
	
				for (var i = 0; i < range.length; i++) {
					
					className = (tpl.value == range[i]) ? "selected" : "";
					
					jQuery('<a href="javascript:;" title="' + range[i] + '"><span class="' + className + '">' + text[i] + '</span></a>').click(function(){
						
						var $this = jQuery(this);
						var value = $this.attr('title');
	
						$this.parent().find('span').removeClass('selected');
						$this.find('span').addClass('selected');
	
						update(tpl.key,value,this);
						
					}).appendTo($items);
				}
				
				$body.append('<th class="caption">' + tpl.caption + '</th>').append($items);
					
			}
		}
		function set(key,value) {
			eval("currentValue." + key + "=" + value+ ";");
		}
		function update(key,value,$obj) {
			set(key,value);	
			if (typeof opts.onChanged == "function") {
				opts.onChanged(currentValue,$container);
			}
		}

	});
};
