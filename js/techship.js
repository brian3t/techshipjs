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
        dataType: 'application/json',
        contentType: 'application/json',
        headers: {}
    },

    init: function () {

    },
    set_header: function () {

    },
    reset_ajax_settings: function () {
        this.ajax_setting.headers = Object.assign(this.ajax_setting.headers, TECHSHIP_CONFIG.header)
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
    },
    /**
     * fetch existing shipment. log into console_log_element
     * @param console_log_element
     */
    fetch_existing_shipment: function (console_log_element) {
        let shipment_id = $('#existing_shipment_id')
        let shipment_xhr = this.get_shipment(shipment_id)
        shipment_xhr.always((data) => {
            if (!data.responseText) return
            $(console_log_element).html(data.responseText)
        })
    }

})


//start using techship
Techship.client_code = CLIENT_CODE
Techship.init()
let get_shipment_xhr = Techship.get_shipment(94911)
get_shipment_xhr.then(data => {
    $('#consolelog').append(`data here ${data}`)
})
get_shipment_xhr.done(data => {
    $('#consolelog').append(`data here ${data}`)
})
get_shipment_xhr.always((data) => {
    try {
        let shipment_details = JSON.parse(data.responseText)
        $('#consolelog').html('BatchNumber: ' + shipment_details.BatchNumber + ' TransactionNumber: ' + shipment_details.TransactionNumber)

    } catch (e) {
        console.error(`error: ${e.message}`);
    }
})
