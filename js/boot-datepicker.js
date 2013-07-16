/* boot-datepicker.js v1.0.0
 * http://github.com/mitris/boot-datepicker
 * Copyright (c) 2013 Dmitry Korniychuk; Licensed MIT */

!function ($) {
    "use strict"; // jshint ;_;

    var cache = {};
    var Datepicker = function (element, options) {
        this.$element = $(element);
        this.options = $.extend(true, {}, $.fn.bootDatepicker.defaults, typeof options == 'object' && options, this.$element.data());
        this.init();
    };

    Datepicker.prototype = {
        constructor: Datepicker,
        init: function () {
            this._f = 'YYYY-MM-DD';
            this.today = moment().startOf('day');
            this.startDate = this.today.clone(); //.startOf('month')
            this.date = [];
            this._initDate();
            this._generateView();
            this._setPosition();
            this._attachEvents();
        },
        _initDate: function() {
            if (this.options.selectedDate instanceof Array) {
                for (var i = 0; i < this.options.selectedDate.length; i++) {
                    this.date.push(moment(this.options.selectedDate[i], this.options.dateFormat).startOf('day').format(this._f));
                }
            } else {
                this._processElementDate();
            }
            if (this.options.minDate && this.options.minDate == 'today') {
                this.minDate = moment().startOf('day');
            } else if(this.options.minDate) {
                this.minDate = moment(this.options.minDate).startOf('day');
            }
            if (this.options.maxDate && this.options.maxDate == 'today') {
                this.maxDate = moment().startOf('day');
            } else if (this.options.maxDate) {
                this.maxDate = moment(this.options.maxDate).startOf('day');
            }
            this.view = $('<div class="boot-datepicker boot-datepicker-' + this.options.calendarViews + '"></div>');
            if (this.options.inline) {
                this.view.addClass('inline').insertAfter(this.$element);
            } else {
                this.view.addClass('popover').appendTo('body');
            }
        },
        _processElementDate: function() {
            if (this.options.target) {
                for(var i = 0; i < this.options.target.length; i++) {
                    var target = this.options.target instanceof jQuery ? this.options.target[i] : $(this.options.target[i]);
                    if(target.is(':input') && target.val()) {
                        var dateStr = moment(target.val(), this.options.dateFormat).startOf('day').format(this._f);
                        if (this.date.indexOf(dateStr) < 0) {
                            this.date.push(dateStr);
                        }
                    }
                }
            } else if (this.$element.is('input, textarea')) {
                var selectedDate = this.$element.val().split(this.options.dateDelimiter[this.options.mode]);
                this.date = [];
                for(var i = 0; i < selectedDate.length; i++) {
                    var dateStr = moment(selectedDate[i], this.options.dateFormat).startOf('day').format(this._f);
                    if (this.date.indexOf(dateStr) < 0) {
                        this.date.push(dateStr);
                    }
                }
            }
        },
        _generateView: function () {
            var subtract, mode = 'add';
            if (this.minDate && this.maxDate) {
//				subtract = this.options.calendarViews;
                mode = 'subtract';
            } else if (this.minDate && !this.maxDate) {
//				/************/
//				var diff = this.startDate.diff(this.minDate, 'month'),
//					floor = Math.floor(this.options.calendarViews / 2),
//					mod = diff % this.options.calendarViews;
//				subtract = diff >= this.options.calendarViews || mod >= floor ? floor : mod;
//				/************/
            } else if (this.maxDate && !this.minDate) {
//				if (this.maxDate.isBefore(this.startDate) || this.maxDate.isSame(this.startDate)) {
//					this.startDate = this.maxDate.clone();
//					mode = 'subtract';
//				} else if(this.maxDate.isAfter(this.startDate) && this.maxDate.diff(this.startDate, 'month') >= this.options.calendarViews) {
//					subtract = Math.floor(this.options.calendarViews / 2);
//				} else {
//				}
            } else {
                subtract = Math.floor(this.options.calendarViews / 2);
            }

            subtract && this.startDate.subtract('month', subtract);

            var views = [];
            for (var i = 0; i < this.options.calendarViews; i++) {
                var date = this.startDate.clone().startOf('month');
                mode == 'add' ? views.push(this._getCalendar(date.add('month', i))) : views.unshift(this._getCalendar(date.subtract('month', i)));
            }
            this.view.html(this._template('view', this.options.template.view, {
                calendar: views.join('')
            }));

            var calendarFirst = this.view.find('table:first'),
                calendarLast = this.view.find('table:last'),
                calendarOther = this.view.find('table').not(calendarFirst).not(calendarLast);
            if(calendarFirst.not(calendarLast)) {
                calendarFirst.find('[data-boot-handler=next]').closest('td').remove();
                calendarFirst.find('[data-boot-handler=current]').closest('td').attr('colspan', 6);
                calendarLast.find('[data-boot-handler=previous]').closest('td').remove();
                calendarLast.find('[data-boot-handler=current]').closest('td').attr('colspan', 6);
            }
            calendarOther.find('[data-boot-handler=next], [data-boot-handler=previous]').closest('td').remove();
            calendarOther.find('[data-boot-handler=current]').closest('td').attr('colspan', 7);
            this._fixWidth();
            this._updateTarget();
        },
        _fixWidth: function () {
            var tableWidth = this.view.find('table').outerWidth(true);
            this.view.width(tableWidth * this.options.calendarViews);
        },
        _getCalendar: function (currentMonth) {
            var currentMonthLength = currentMonth.daysInMonth(),
                currentMonthWeekDay = currentMonth.day() - this.options.weekStartDay,
                previousMonthButtonAttributes = [], nextMonthButtonAttributes = [],
                captions = [], weeks = [];
            if (this.options.extendedMonth) {
                var previousMonth = currentMonth.clone().subtract('months', 1),
                    nextMonth = currentMonth.clone().add('months', 1),
                    previousMonthLength = previousMonth.daysInMonth();
            }

            var dayOfWeek = moment();
            for (var i = 0; i <= 6; i++) {
                var pos = i + this.options.weekStartDay,
                    day = pos > 6 ? pos - 6 - 1 : pos;
                captions.push(dayOfWeek.day(day).format(this.options.weekCaptionFormat));
            }
            var day = 1;
            for (var i = 0; i < 42; i++) {
                var dayClasses = this.options.dayClasses.slice(0),
                    wn = Math.floor(i / 7),
                    dateStr, currentDate = false, buttonAttributes = [];
                if (!weeks[wn]) {
                    weeks[wn] = [];
                }
                if (this.options.extendedMonth && i < currentMonthWeekDay) {
                    currentDate = previousMonthLength - currentMonthWeekDay + i + 1;
                    previousMonth.date(currentDate);
                    dateStr = previousMonth.format(this._f);
                    dayClasses.push('disabled');
                } else if (i >= currentMonthWeekDay && day <= currentMonthLength) {
                    currentDate = day++;
                    currentMonth.date(currentDate);
                    dateStr = currentMonth.format(this._f);
                } else if (this.options.extendedMonth && day > currentMonthLength) {
                    currentDate = i - currentMonthLength - currentMonthWeekDay + 1;
                    nextMonth.date(currentDate);
                    dateStr = nextMonth.format(this._f);
                    dayClasses.push('disabled');
                }
                if (!this.today.diff(dateStr)) {
                    dayClasses.push('btn-success', 'today');
                }
                if (this.date.indexOf(dateStr) >= 0  || this.date.length == 2 && dateStr >= this.date[0] && dateStr <= this.date[1]) {
                    // remake with the mode option
                    dayClasses = dayClasses.concat(this.options.activeDayClasses);
                }
                if (this.minDate && dateStr < this.minDate.format(this._f) || this.maxDate && dateStr > this.maxDate.format(this._f)) {
                    buttonAttributes.push('disabled', 'style="opacity: 0.25"');
                }
                if (currentDate) {
                    weeks[wn] += this._template('body_cell', this.options.template.body_cell, {
                        dateStr: dateStr,
                        dayClasses: dayClasses.join(' '),
                        buttonAttributes: buttonAttributes.join(' '),
                        currentDate: currentDate
                    });
                } else {
                    weeks[wn] += this._template('body_empty_cell', this.options.template.body_empty_cell, {});
                }
            }
            if (this.minDate && moment(this.minDate).startOf('month').format(this._f) == moment(currentMonth).startOf('month').format(this._f)) {
                previousMonthButtonAttributes.push('disabled');
            }
            if (this.maxDate && moment(this.maxDate).endOf('month').format(this._f) == moment(currentMonth).endOf('month').format(this._f)) {
                nextMonthButtonAttributes.push('disabled');
            }
            return this._template('calendar', this.options.template.calendar, {
                'thead': this._template('head', this.options.template.head, {
                    'previous': this._template('head_previous', this.options.template.head_previous, {
                        attributes: previousMonthButtonAttributes.join(' ')
                    }),
                    'current': this._template('head_current', this.options.template.head_current, {
                        month: currentMonth.format(this.options.monthFormat),
                        year: currentMonth.year()
                    }),
                    'next': this._template('head_next', this.options.template.head_next, {
                        attributes: nextMonthButtonAttributes.join(' ')
                    }),
                    'captions': captions
                }),
                'tbody': this._template('body', this.options.template.body, {
                    weeks: weeks
                })
            });
        },
        _setPosition: function () {
            // not working properly
            if (this.options.inline) {
                return;
            }
            var pos = {
                    top: this.$element.offset().top,
                    left: this.$element.offset().left,
                    height: this.$element.outerHeight(true),
                    width: this.$element.outerWidth(true)
                },
                actualWidth = this.view.outerWidth(true),
                actualHeight = this.view.outerHeight(true),
                placement = this.options.placement,
                placement_split = placement.split(' '),
                offset = {};
            switch (placement) {
                case 'top':
                    offset = {top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2};
                    break;
                case 'top right':
                    offset = {top: pos.top - actualHeight, left: pos.left};
                    break;
                case 'top left':
                    offset = {top: pos.top - actualHeight, left: pos.left + pos.width - actualWidth};
                    break;
                case 'right':
                    offset = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width};
                    break;
                case 'bottom':
                    offset = {top: pos.top + pos.height, left: pos.left + pos.width / 2 - actualWidth / 2};
                    break;
                case 'bottom right':
                    offset = {top: pos.top + pos.height, left: pos.left};
                    break;
                case 'bottom left':
                    offset = {top: pos.top + pos.height, left: pos.left + pos.width - actualWidth};
                    break;
                case 'left':
                    offset = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth};
                    break;
            }
            this.view.offset(offset).addClass(placement_split[0]);
            if (placement_split.length > 1) {
                this.view.addClass(placement_split.join('-'));
            }
            this.view.hide();
        },
        _attachEvents: function () {
            var self = this,
                view = self.view;
            this.view.off('click.boot-datepicker');
            view.on('click.boot-datepicker', function (e) {
                e.stopPropagation();
            });
            view.on('click.boot-datepicker', '[data-boot-handler=previous]', function () {
                self.gotoPreviousMonth();
            });
            view.on('click.boot-datepicker', '[data-boot-handler=next]', function () {
                self.gotoNextMonth();
            });
            view.on('click.boot-datepicker', 'tbody button', function () {
                self._setDate($(this).data('date'));
            });
            self.$element.on('change.boot-datepicker', function() {
                self._processElementDate();
                if (self.view.is(':visible')) {
                    self._generateView();
                }
            });
            if (!self.options.inline) {
                self.$element.on('click.boot-datepicker', function (e) {
                    e.stopPropagation();
                    self.toggle();
                });
                $(document).on('click.boot-datepicker', function () {
                    if (self.view.is(':visible')) {
                        self.toggle('hide');
                    }
                });
            }
        },
        _template: function (name, template, data) {
            /* JS templating by John Resig - http://ejohn.org/blog/javascript-micro-templating */
            var data = data || {}, fn = cache[name] = cache[name] || new Function("obj", "var p=[],print=function(){p.push.apply(p,arguments);};with(obj){p.push('" + template.replace(/[\r\t\n]/g, " ").split("<%").join("\t").replace(/((^|%>)[^\t]*)'/g, "$1\r").replace(/\t=(.*?)%>/g, "',$1,'").split("\t").join("');").split("%>").join("p.push('").split("\r").join("\\'") + "');}return p.join('');");
            var out = fn(data);
            return out;
        },
        _setDate: function (dateStr) {
            var self = this,
                collection = self.view.find('tbody button');
            switch (self.options.mode) {
                case 'single':
                    collection.removeClass(self.options.activeDayClasses.join(' '));
                    collection.filter('[data-date=' + dateStr + ']').addClass(self.options.activeDayClasses.join(' '));
                    self.date = [dateStr];
                    !self.options.inline && self.options.hideOnSelect && self.toggle('hide');
                    break;
                case 'multiple':
                    var indexOf = self.date.indexOf(dateStr);
                    if (indexOf >= 0) {
                        self.date.splice(indexOf, 1);
                        collection.filter('[data-date=' + dateStr + ']').removeClass(self.options.activeDayClasses.join(' '));
                    } else if (self.options.maxSelectedDates == 0 || self.date.length < self.options.maxSelectedDates) {
                        self.date.push(dateStr);
                        collection.filter('[data-date=' + dateStr + ']').addClass(self.options.activeDayClasses.join(' '));
                    }
                    if(!self.options.inline && self.options.hideOnSelect && self.options.maxSelectedDates && self.date.length >= self.options.maxSelectedDates) {
                        setTimeout(function() {
                            self.toggle('hide');
                        }, self.options.hideOnSelectDelay);
                    }
                    break;
                case 'range':
                    if (self.date.length == 2) {
                        self.date = [];
                        collection.removeClass(self.options.activeDayClasses.join(' '));
                    }
                    if (self.date.length != 0 && self.date[0] > dateStr) {
                        self.date.unshift(dateStr);
                    } else {
                        self.date.push(dateStr);
                        collection.filter('[data-date=' + dateStr + ']').addClass(self.options.activeDayClasses.join(' '));
                    }
                    if (self.date.length == 2) {
                        // try manipulate DOM with native JS, mb it's will be more faster
                        collection.filter(function () {
                            return $(this).data('date') >= self.date[0] && $(this).data('date') <= self.date[1];
                        }).addClass(self.options.activeDayClasses.join(' '));
                        if(!this.options.inline && this.options.hideOnSelect) {
                            this.options.onRangeSelect(this.date);
                            setTimeout(function() {
                                self.toggle('hide');
                            }, self.options.hideOnSelectDelay);
                        }
                    }
                    break;
            }
            this._updateTarget();
        },
        _updateTarget: function() {
            var out = [];
            for (var i = 0; i < this.date.length; i++) {
                out.push(moment(this.date[i]).startOf('day').format(this.options.dateFormat));
            }
            var outPlain = out.join(this.options.dateDelimiter[this.options.mode]);
            this.$element.is(':input') && this.$element.val(outPlain);
            if(this.options.targetDisplay) {
                var target = this.options.targetDisplay instanceof jQuery ? this.options.targetDisplay : $(this.options.targetDisplay);
                var format = this._template('target_display_format', this.options.targetDisplayFormat, {
                    date: outPlain
                });
                target.html(format);
            }
            if (this.options.target) {
                for(var i = 0; i < this.options.target.length; i++) {
                    var target = this.options.target instanceof jQuery ? this.options.target[i] : $(this.options.target[i]);
                    target.is(':input') && target.val(out[i]);
                }
            }
        },
        setDate: function (date) {
            if (!date || 'undefined' === typeof date) {
                this.clear();
                return;
            } else if ('string' === typeof date) {
                date = [date];
            }
            for (var i = 0; i < date.length; i++) {
                this._setDate(moment(date[i]).startOf('day').format(this._f));
            }
        },
        setMaxDate: function (date) {
            // add option for date subtraction
            this.maxDate = date ? moment(date).startOf('day') : false;
            this._generateView();
        },
        setMinDate: function (date) {
            // add option for date subtraction
            this.minDate = date ? moment(date).startOf('day') : false;
            this._generateView();
        },
        gotoPreviousMonth: function () {
            this.startDate.subtract('month', 1);
            this._generateView();
        },
        gotoNextMonth: function () {
            this.startDate.add('month', 1);
            this._generateView();
        },
        clear: function () {
            this.date = [];
            this.$element.is('input, textarea') && this.$element.val('');
            this._generateView();
        },
        toggle: function (state) {
            if (state == 'show') {
                this.view.fadeTo('fast');
            } else if (state == 'hide') {
                this.view.fadeOut('fast');
            } else {
                this.view.fadeToggle('fast');
            }
        }
    };

    /* PLUGIN DEFINITION */
    $.fn.bootDatepicker = function (option) {
        var args = Array.apply(null, arguments);
        args.shift();
        return this.each(function () {
            var $this = $(this), data = $this.data('bootDatepicker'), options = typeof option == 'object' && option;
            if (!data || typeof data != 'object') {
                $this.data('bootDatepicker', (data = new Datepicker(this, options)));
            }
            if (typeof option == 'string' && typeof data[option] == 'function' && option.charAt(0) != '_') {
                return data[option].apply(data, args);
            } else if (typeof option == 'string' && typeof data[option] == 'undefined') {
                jQuery.error("BootDatepicker: Method \"" + option + "\" does not exist.");
            }
        });
    };

    $.fn.bootDatepicker.defaults = {
        weekStartDay: 1, // 0 - Sunday, 1 - Monday
        weekCaptionFormat: 'dd',
        calendarViews: 3, // 3
        mode: 'range', // single|multiple|range
        language: 'en',
        inline: true,
        extendedMonth: true,
        hideOnSelect: true,
        hideOnSelectDelay: 300,
        placement: 'bottom',
        dateFormat: 'MM/DD/YYYY',
        minDate: false,
        maxDate: false,
        selectedDate: false,
        target: false,
        targetDisplay: false,
        targetDisplayFormat: '<%= date %>',
        maxSelectedDates: 3,
        monthFormat: 'MMMM',
        dayClasses: ['btn', 'btn-small', 'btn-block'],
        activeDayClasses: ['active', 'btn-info'],
        onRangeSelect: function() {

        },
        dateDelimiter: {
            single: ', ',
            multiple: ', ',
            range: ' - '
        },
        template: {
            view: '<div class="arrow"></div><div class="popover-content"><%= calendar %></div>',
            calendar: '<table data-handler="calendar"><%= thead %><%= tbody %></table>',
            head: '<thead><tr><td><%= previous %></td><td colspan="5"><%= current %></td><td><%= next %></td></tr><tr><% for(var i = 0; i <= 6; i++) { %><th><%= captions[i] %></th><% } %></tr></thead>',
            head_previous: '<button type="button" class="btn btn-block btn-small" <%= attributes %> data-boot-handler="previous"><i class="icon-chevron-left"></i></button>',
            head_current: '<button type="button" class="btn btn-block btn-small" data-boot-handler="current"><span class="month"><%= month %></span> <span class="year"><%= year %></span></button>',
            head_next: '<button type="button" class="btn btn-block btn-small" <%= attributes %> data-boot-handler="next"><i class="icon-chevron-right"></i></button>',
            body: '<tbody><% for(var i = 0; i <= 5; i++) { %><tr><%= weeks[i] %></tr><% } %></tbody>',
            body_cell: '<td><button data-date="<%= dateStr %>" <%= buttonAttributes %> type="button" class="<%= dayClasses %>"><%= currentDate %></button></td>',
            body_empty_cell: '<td></td>'
        }
    };

}(window.jQuery);
