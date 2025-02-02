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

/** @module views/dashlet */

import View from 'view'

/**
 * A dashlet container view.
 */
class DashletView extends View {

    /** @inheritDoc */
    template = 'dashlet'

    /**
     * A dashlet name.
     *
     * @type {string}
     */
    name = ''

    /**
     * A dashlet ID.
     *
     * @type {string}
     */
    id = ''

    /**
     * An options view name.
     *
     * @protected
     * @type {string|null}
     */
    optionsView = null

    /** @inheritDoc */
    data() {
        return {
            name: this.name,
            id: this.id,
            title: this.getTitle(),
            actionList: (this.getBodyView() || {}).actionList || [],
            buttonList: (this.getBodyView() || {}).buttonList || [],
            noPadding: (this.getBodyView() || {}).noPadding,
        };
    }

    /** @inheritDoc */
    events = {
        /** @this DashletView */
        'click .action': function (e) {
            let $target = $(e.currentTarget);
            let action = $target.data('action');
            let data = $target.data();

            if (action) {
                let method = 'action' + Espo.Utils.upperCaseFirst(action);

                delete data['action'];

                if (typeof this[method] == 'function') {
                    e.preventDefault();

                    this[method].call(this, data);
                } else {
                    let bodyView = this.getView('body');

                    if (typeof bodyView[method] == 'function') {
                        e.preventDefault();
                        bodyView[method].call(bodyView, data);
                    }
                }
            }
        },
        /** @this DashletView */
        'mousedown .panel-heading .dropdown-menu': function (e) {
            // Prevent dragging.
            e.stopPropagation();
        },
        /** @this DashletView */
        'shown.bs.dropdown .panel-heading .btn-group': function (e) {
            this.controlDropdownShown($(e.currentTarget).parent());
        },
        /** @this DashletView */
        'hide.bs.dropdown .panel-heading .btn-group': function () {
            this.controlDropdownHide();
        },
    }

    controlDropdownShown($dropdownContainer) {
        let $panel = this.$el.children().first();

        let dropdownBottom = $dropdownContainer.find('.dropdown-menu')
            .get(0).getBoundingClientRect().bottom;

        let panelBottom = $panel.get(0).getBoundingClientRect().bottom;

        if (dropdownBottom < panelBottom) {
            return;
        }

        $panel.addClass('has-dropdown-opened');
    }

    controlDropdownHide() {
        this.$el.children().first().removeClass('has-dropdown-opened');
    }

    /** @inheritDoc */
    setup() {
        this.name = this.options.name;
        this.id = this.options.id;

        this.on('resize', () => {
            let bodyView = this.getView('body');

            if (!bodyView) {
                return;
            }

            bodyView.trigger('resize');
        });

        let viewName = this.getMetadata().get(['dashlets', this.name, 'view']) ||
            'views/dashlets/' + Espo.Utils.camelCaseToHyphen(this.name);

        this.createView('body', viewName, {
            el: this.options.el + ' .dashlet-body',
            id: this.id,
            name: this.name,
            readOnly: this.options.readOnly,
            locked: this.options.locked,
        });
    }

    /**
     * Refresh.
     */
    refresh() {
        this.getView('body').actionRefresh();
    }

    actionRefresh() {
        this.refresh();
    }

    actionOptions() {
        let optionsView =
            this.getMetadata().get(['dashlets', this.name, 'options', 'view']) ||
            this.optionsView ||
            'views/dashlets/options/base';

        Espo.Ui.notify(' ... ');

        this.createView('options', optionsView, {
            name: this.name,
            optionsData: this.getOptionsData(),
            fields: this.getBodyView().optionsFields,
        }, view => {
            view.render();

            Espo.Ui.notify(false);

            this.listenToOnce(view, 'save', (attributes) => {
                let id = this.id;

                Espo.Ui.notify(this.translate('saving', 'messages'));

                this.getPreferences().once('sync', () => {
                    this.getPreferences().trigger('update');

                    Espo.Ui.notify(false);

                    view.close();
                    this.trigger('change');
                });

                let o = this.getPreferences().get('dashletsOptions') || {};

                o[id] = attributes;

                this.getPreferences().save({dashletsOptions: o}, {patch: true});
            });
        });
    }

    /**
     * Get options data.
     *
     * @returns {Object}
     */
    getOptionsData() {
        return this.getBodyView().optionsData;
    }

    /**
     * Get an option value.
     *
     * @param {string} key A option name.
     * @returns {*}
     */
    getOption(key) {
        return this.getBodyView().getOption(key);
    }

    /**
     * Get a dashlet title.
     *
     * @returns {string}
     */
    getTitle() {
        return this.getBodyView().getTitle();
    }

    /**
     * @return {module:views/dashlets/abstract/base}
     */
    getBodyView() {
        return this.getView('body');
    }

    actionRemove() {
        this.confirm(this.translate('confirmation', 'messages'), () => {
            this.trigger('remove-dashlet');
            this.$el.remove();
            this.remove();
        });
    }
}

export default DashletView;
