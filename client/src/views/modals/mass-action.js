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
import Model from 'model';

class MassActionModalView extends ModalView {

    template = 'modals/mass-action'

    className = 'dialog dialog-record'
    checkInterval = 4000

    data() {
        return {
            infoText: this.translate('infoText', 'messages', 'MassAction'),
        };
    }

    setup() {
        this.action = this.options.action;
        this.id = this.options.id;
        this.status = 'Pending';

        this.headerText =
            this.translate('Mass Action', 'scopeNames') + ': ' +
            this.translate(this.action, 'massActions', this.options.scope);

        this.model = new Model();
        this.model.name = 'MassAction';

        this.model.setDefs({
            fields: {
                'status': {
                    type: 'enum',
                    readOnly: true,
                    options: [
                        'Pending',
                        'Running',
                        'Success',
                        'Failed',
                    ],
                    style: {
                        'Success': 'success',
                        'Failed': 'danger',
                    },
                },
                'processedCount': {
                    type: 'int',
                    readOnly: true,
                },
            }
        });

        this.model.set({
            status: this.status,
            processedCount: null,
        });

        this.createView('record', 'views/record/edit-for-modal', {
            scope: 'None',
            model: this.model,
            el: this.getSelector() + ' .record',
            detailLayout: [
                {
                    rows: [
                        [
                            {
                                name: 'status',
                                labelText: this.translate('status', 'fields', 'MassAction'),
                            },
                            {
                                name: 'processedCount',
                                labelText: this.translate('processedCount', 'fields', 'MassAction'),
                            },
                        ],
                    ],
                },
            ],
        });

        this.on('close', () => {
            let status = this.model.get('status');

            if (
                status !== 'Pending' &&
                status !== 'Running'
            ) {
                return;
            }

            Espo.Ajax.postRequest(`MassAction/${this.id}/subscribe`);
        });

        this.checkStatus();
    }

    checkStatus() {
        Espo.Ajax
            .getRequest(`MassAction/${this.id}/status`)
            .then(response => {
                let status = response.status;

                this.model.set('status', status);

                if (status === 'Pending' || status === 'Running') {
                    setTimeout(() => this.checkStatus(), this.checkInterval);

                    return;
                }

                this.model.set({
                    processedCount: response.processedCount,
                });

                if (status === 'Success') {
                    this.trigger('success', {
                        count: response.processedCount,
                    });
                }

                if (this.$el) {
                    this.$el.find('.info-text').addClass('hidden');
                }
            });
    }
}

export default MassActionModalView;
