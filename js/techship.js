"use strict";
const CLIENT_CODE = 'TEST'

/**
 * Techship integration
 * Required: jQuery
 **/

window.Techship = window.Techship || {}
window.Techship = _.extend(Techship, {
    client_code: null,
    header: {},
    ajax_setting: {
        dataType: 'json',
        headers: {}
    },

    init: function () {

    },
    set_header: function () {

    },
    reset_ajax_settings: function () {
        this.ajax_setting.headers = TECHSHIP_CONFIG.header
    },

    /**
     * get shipment
     * @param shipment_id
     * @returns jqXHR
     */
    get_shipment: function (shipment_id) {
        this.reset_ajax_settings()
        let url = TECHSHIP_CONFIG.root + `/shipments/${shipment_id}`
        return $.ajax(_.extend(this.ajax_setting, {
            url: url
        }))
    }
})


//start using techship
Techship.client_code = CLIENT_CODE
Techship.init()
let get_shipment_xhr=Techship.get_shipment(94911)