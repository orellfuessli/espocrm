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

import ModalView from 'views/modal';
import SearchManager from 'search-manager';

class ActionHistoryModalView extends ModalView {

    template = 'modals/action-history'

    scope = 'ActionHistoryRecord'
    className = 'dialog dialog-record'
    backdrop = true

    setup() {
        super.setup();

        this.buttonList = [
            {
                name: 'cancel',
                label: 'Close',
            },
        ];

        this.scope = this.entityType = this.options.scope || this.scope;

        this.$header = $('<a>')
            .attr('href', '#ActionHistoryRecord')
            .addClass('action')
            .attr('data-action', 'listView')
            .text(this.getLanguage().translate(this.scope, 'scopeNamesPlural'));

        this.waitForView('list');

        this.getCollectionFactory().create(this.scope, collection => {
            collection.maxSize = this.getConfig().get('recordsPerPage') || 20;
            this.collection = collection;

            this.loadSearch();
            this.loadList();

            collection.fetch();
        });
    }

    // noinspection JSUnusedGlobalSymbols
    actionListView() {
        this.getRouter().navigate('#ActionHistoryRecord', {trigger: true});
        this.close();
    }

    loadSearch() {
        let searchManager = this.searchManager =
            new SearchManager(this.collection, 'listSelect', null, this.getDateTime());

        this.collection.data.boolFilterList = ['onlyMy'];
        this.collection.where = searchManager.getWhere();

        this.createView('search', 'views/record/search', {
            collection: this.collection,
            el: this.containerSelector + ' .search-container',
            searchManager: searchManager,
            disableSavePreset: true,
            textFilterDisabled: true,
        });
    }

    loadList() {
        let viewName = this.getMetadata().get(`clientDefs.${this.scope}.recordViews.list`) ||
           'views/record/list';

        this.listenToOnce(this.collection, 'sync', () => {
            this.createView('list', viewName, {
                collection: this.collection,
                el: this.containerSelector + ' .list-container',
                selectable: false,
                checkboxes: false,
                massActionsDisabled: true,
                rowActionsView: 'views/record/row-actions/view-only',
                type: 'listSmall',
                searchManager: this.searchManager,
                checkAllResultDisabled: true,
                buttonsDisabled: true,
            });
        });
    }
}

export default ActionHistoryModalView;
