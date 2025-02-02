/************************************************************************
 * This file is part of EspoCRM.
 *
 * EspoCRM - Open Source CRM application.
 * Copyright (C) 2014-2023 Yurii Kuznietsov, Taras Machyshyn, Oleksii Avramenko
 * Website: https://www.espocrm.com
 *
 * EspoCRM is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * EspoCRM is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EspoCRM. If not, see http://www.gnu.org/licenses/.
 *
 * The interactive user interfaces in modified source and object code versions
 * of this program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU General Public License version 3.
 *
 * In accordance with Section 7(b) of the GNU General Public License version 3,
 * these Appropriate Legal Notices must retain the display of the "EspoCRM" word.
 ************************************************************************/

define('views/global-search/global-search', ['view'], function (Dep) {

    return Dep.extend({

        template: 'global-search/global-search',

        events: {
            'keydown input.global-search-input': function (e) {
                let key = Espo.Utils.getKeyFromKeyEvent(e);

                if (e.code === 'Enter' || key === 'Enter' || key === 'Control+Enter') {
                    this.runSearch();

                    return;
                }

                if (key === 'Escape') {
                    this.closePanel();
                }
            },
            'click [data-action="search"]': function () {
                this.runSearch();
            },
            'focus input.global-search-input': function (e) {
                e.currentTarget.select();
            },
        },

        setup: function () {
            this.wait(true);

            this.getCollectionFactory().create('GlobalSearch', collection => {
                this.collection = collection;
                collection.url = 'GlobalSearch';

                this.wait(false);
            });
        },

        afterRender: function () {
            this.$input = this.$el.find('input.global-search-input');
        },

        runSearch: function () {
            let text = this.$input.val().trim();

            if (text !== '' && text.length >= 2) {
                this.search(text);
            }
        },

        search: function (text) {
            this.collection.url = this.collection.urlRoot =  'GlobalSearch?q=' + encodeURIComponent(text);

            this.showPanel();
        },

        showPanel: function () {
            this.closePanel();

            var $container = $('<div>').attr('id', 'global-search-panel');

            $container.appendTo(this.$el.find('.global-search-panel-container'));

            this.createView('panel', 'views/global-search/panel', {
                el: '#global-search-panel',
                collection: this.collection,
            }, function (view) {
                view.render();

                this.listenToOnce(view, 'close', this.closePanel);
            });

            let $document = $(document);

            $document.on('mouseup.global-search', (e) => {
                if (e.which !== 1) {
                    return;
                }

                if (!$container.is(e.target) && $container.has(e.target).length === 0) {
                    this.closePanel();
                }
            });

            $document.on('click.global-search', (e) => {
                if (
                    e.target.tagName === 'A' &&
                    $(e.target).data('action') !== 'showMore' &&
                    !$(e.target).hasClass('global-search-button')
                ) {
                    setTimeout(() => {
                        this.closePanel();
                    }, 100);
                }
            });
        },

        closePanel: function () {
            let $container = $('#global-search-panel');

            $container.remove();

            let $document = $(document);

            if (this.hasView('panel')) {
                this.getView('panel').remove();
            }

            $document.off('mouseup.global-search');
            $document.off('click.global-search');
        },
    });
});
