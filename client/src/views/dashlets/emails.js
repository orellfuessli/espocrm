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

define('views/dashlets/emails', ['views/dashlets/abstract/record-list'], function (Dep) {

    return Dep.extend({

        name: 'Emails',
        scope: 'Emails',

        rowActionsView: 'views/email/record/row-actions/dashlet',
        listView: 'views/email/record/list-expanded',

        setupActionList: function () {
            if (this.getAcl().checkScope(this.scope, 'create')) {
                this.actionList.unshift({
                    name: 'compose',
                    text: this.translate('Compose Email', 'labels', this.scope),
                    iconHtml: '<span class="fas fa-plus"></span>',
                });
            }
        },

        actionCompose: function () {
            var attributes = this.getCreateAttributes() || {};

            Espo.Ui.notify(' ... ');

            var viewName = this.getMetadata().get('clientDefs.' + this.scope + '.modalViews.compose') ||
                'views/modals/compose-email';

            this.createView('modal', viewName, {
                scope: this.scope,
                attributes: attributes,
            }, view => {
                view.render();

                Espo.Ui.notify(false);

                this.listenToOnce(view, 'after:save', () => {
                    this.actionRefresh();
                });
            });
        },

        /**
         * @return {module:search-manager~data}
         */
        getSearchData: function () {
            return {
                'advanced': [
                    {
                        'attribute': 'folderId',
                        'type': 'inFolder',
                        'value': this.getOption('folder') || 'inbox',
                    }
                ]
            };
        },
    });
});
