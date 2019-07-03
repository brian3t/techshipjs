"use strict";
const CLIENT_CODE = 'TEST'
var IMAGES = []

/**
 * Techship integration
 * Required: jQuery
 **/


function base64_encode(str) {
    return btoa(str.replace(/[\u00A0-\u2666]/g, function (c) {
        return '&#' + c.charCodeAt(0) + ';';
    }));
}


window.Techship = window.Techship || {}
window.Techship = _.extend(Techship, {
    client_code: null,
    header: {},
    ajax_setting: {
        crossDomain: true,
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
     * request for a raw image from labelary API
     * @param raw_zpl_encoded
     * @param shipment_id string - used to determine <tr> to update with cb
     */
    get_img_fr_labelary: function (raw_zpl_encoded, shipment_id) {
        let img_element = $('#shipment_table .shipment_id').siblings('.img')
        // const base_url = 'http://api.labelary.com/v1/printers/24dpmm/labels/4x6/0/'
        const base_url = TECHSHIP_CONFIG.relay_server + '/get_labelary/'
        try {
            let raw_zpl = window.atob(raw_zpl_encoded)
            $.ajax({
                url: base_url + raw_zpl_encoded,
                method: 'GET',
                processData: false,
                success: (image_base64_enc) => {
                    if (typeof image_base64_enc !== 'string') {
                        console.error(`returned data is not string`)
                        return img_element.html(`returned data is not string`)
                    }
                    window.image = image_base64_enc
                    // console.log(`returned img: ${image.slice(0, 20)}`)
                    /*if (! image.startsWith('�PNG')) {
                        console.error(`returned data is not png`)
                        return img_element.html(`returned data is not png`)
                    }*/
                    let img = $('<img/>')
                    img.prop('src', 'data:image/png,' + image_base64_enc)
                    img.prop('alt', 'label in png format')
                    img_element.html(img)
                    img.on('click', () => {
                            let content = atob(image);
                            //content = content.slice(1)
                            // let content = '';
                            let filename = "label_to_print.png";
                            let blob = new Blob([content], {
                                type: "image/png"
                            });

                            saveAs(blob, filename)
                        }
                    );
                }
            })
        } catch (e) {
            console.error(`Cannot decode64 ${e.toString()}`)
            return img_element.html(`Cannot decode64 ${e.toString()}`)
        }
    },
    /**
     * add a json shipment to a html table
     * @param json_ship
     */
    add_json_data_to_table: function (json_ship) {
        let $shipment_table = $('#shipment_table')
        if (! json_ship || typeof json_ship !== 'object' || ! (json_ship.BatchNumber)) {
            return console.error(`bad json ship data`);
        }
        if (! json_ship.Packages && ! json_ship.Labels) {
            return console.error(`Missing either Packages or Labels`)
        }
        let first_package = {}
        if (json_ship.Packages) {
            first_package = json_ship.Packages.pop()
        } else if (json_ship.Labels) {
            first_package = json_ship.Labels.pop()
        }
        let first_tracking_id = first_package.TrackingNumber || 'N/A'
        let first_label = {}
        if (json_ship.Packages) {
            first_label = first_package.Labels.pop()
        } else if (json_ship.Labels) {
            first_label = first_package
        }
        let shipment_id = NaN
        if (json_ship.Packages){
            shipment_id = json_ship.Id
        } else if (json_ship.Labels){
            shipment_id = json_ship.ShipmentId
        }
        let label_raw = first_label.Label

        let tr = $('<tr></tr>')

        tr.append(`<td class="shipment_id" data-shipment_id="${shipment_id}">${shipment_id}</td>`)
            .append(`<td>${json_ship.BatchNumber}</td>`).append(`<td>${json_ship.ManifestId}</td>`)
            .append(`<td>${json_ship.ClientCode}</td>`).append(`<td>${json_ship.CarrierCode}</td>`).append(`<td>${json_ship.TransactionNumber}</td>`)
            .append(`<td>${json_ship.ShipToName}</td>`).append(`<td>${json_ship.ShipToCity}</td>`).append(`<td>${first_tracking_id}</td>`)
            .append(`<td class="zpl"><button type="button" class="btn btn-primary btn-sm">zpl</button></td>`)
            .append(`<td class="png">
<a href="${TECHSHIP_CONFIG.relay_server}/get_labelary/${label_raw}/filetype/png/filename/${shipment_id}_${first_package.TrackingNumber}_label.png" target="_blank" class="btn btn-primary btn-sm">png</a>
</td>`)
            .append(`<td class="pdf">
<a href="${TECHSHIP_CONFIG.relay_server}/get_labelary/${label_raw}/filetype/pdf/filename/${shipment_id}_${first_package.TrackingNumber}_label.pdf" target="_blank" class="btn btn-primary btn-sm">pdf</a>
</td>`)

        $shipment_table.append(tr)
        if (first_label.Type === 2) {//ZPL
            this.get_img_fr_labelary(first_label.Label, shipment_id)
        }
        $shipment_table.off('click', 'button')
        $shipment_table.on('click', '.zpl button', function (e) {
            let content = atob(label_raw);
            let filename = `${shipment_id}_${first_package.TrackingNumber}_label_to_print.zpl`;
            let blob = new Blob([content], {
                type: "application/text"
            });
            saveAs(blob, filename)
        })
    },

    /**
     * get shipment
     * @param shipment_id
     * @returns jqXHR
     */
    get_shipment: function (shipment_id) {
        this.reset_ajax_settings()
        let url = TECHSHIP_CONFIG.relay_server + `/shipments/${shipment_id}`
        return $.ajax(_.extend(this.ajax_setting, {
            url: url
        }))
    },
    /**
     * fetch existing shipment. log into console_log_element
     * @param console_log_element
     */
    fetch_existing_shipment: function (console_log_element) {
        let shipment_id = $('#existing_shipment_id').val()
        let shipment_xhr = this.get_shipment(shipment_id)
        shipment_xhr.always((data) => {
            if (! data.responseText) return
            try {
                let data_object = JSON.parse(data.responseText)
                let reformatted_json = JSON.stringify(data_object, undefined, 2)
                $(console_log_element).html(reformatted_json)
                this.add_json_data_to_table(data_object)
            } catch (e) {
                console.error(`Cannot parse reply as json: ${data.responseText}`);
            }
        })
    },
    /**
     * Ajax call to relay_server to create ship
     *      * data_to_send: {
    "BatchNumber": "testbrian06272121",
    "TransactionNumber": "testbrian06272121",
    "PackageDescription": "testpkg06272121",
    "ClientCode": "{{client-code}}",
    "CarrierCode": "UPS",
    "ShipToName": "TEST LABEL DONOT SHIP",
    "ShipToAddress1": "5995 Dandridge Ln",
    "ShipToCity": "San Diego",
    "ShipToStateProvince": "CA",
    "ShipToPostal": "92115",
    "ShipToCountry": "US",
    "Packages": [
        {
            "SSCC": "13579",
            "Weight": 3.3,
            "BoxWidth": 3,
            "BoxHeight": 4,
            "BoxLength": 5
        }
    ]
}
     */
    call_cr8_ship: function () {
        let form_serialized_array = $('#cr8_ship_form').serializeArray()
        let cr8_form_data = serialized_to_object(form_serialized_array)
        cr8_form_data.Packages = [
            {SSCC: 13579, Weight: 3.3, BoxWidth: 4.4, BoxHeight: 5.5, BoxLength: 6.6}
        ]
        //now submit this to relay server
        this.reset_ajax_settings()
        let relay_url = TECHSHIP_CONFIG.relay_server + `/shipments/create?duplicateHandling=2&errorLabelMode=0`
        return $.ajax(_.extend(this.ajax_setting, {
            url: relay_url,
            data: JSON.stringify(cr8_form_data),
            dataType: 'json',
            method: 'POST',
            timeout: 120000,
            error: (error_msg) => {
                alert(`Error creating shipment` + error_msg.toString())
            },
            success: (created_ship) => {
                $('#consolelog').html(created_ship)
                $('#cr8_ship_modal').hide()
                $(".modal-backdrop").hide()
                $.toast({
                    text: 'Shipment created successfully',
                    position: 'top-center',
                })
                this.add_json_data_to_table(created_ship)

            },
            complete: hide_spinner
        }))

    },
    /**
     * show modal to ask for data, then create shipment
     */
    create_shipment: function () {
        let $cr8_ship_modal = $('#cr8_ship_modal')
        let modal_options = {}
        $cr8_ship_modal.modal(modal_options)
    },
    /**
     * show modal to ask for data, then create shipment
     */
    delete_existing_shipment: function () {
        this.reset_ajax_settings()
        let shipment_id = $('#delete_existing_shipment_id').val()
        let relay_url = TECHSHIP_CONFIG.relay_server + `/shipments/${shipment_id}/delete`
        return $.ajax(_.extend(this.ajax_setting, {
            url: relay_url,
            method: 'PUT',
            timeout: 120000,
            error: (jqXHR, status, error_msg) => {
                alert(`Error deleting shipment` + error_msg.toString())
            },
            success: (deletion_result) => {
                if (!deletion_result.Success){
                    alert(`Error deleting shipment, bad reply`)
                }
                $('#consolelog').html(deletion_result.Error)
                if (! deletion_result.Success === true){
                    alert(`Error deleting shipment, message: ` + deletion_result.Error)
                }
                toast(`Shipment deleted successfully!`)
                $(`td.shipment_id[data-shipment_id = ${shipment_id}]`).closest('tr').remove()
            },
            complete: hide_spinner
        }))

    }

})


//start using techship
Techship.client_code = CLIENT_CODE
Techship.init()

/*let get_shipment_xhr = Techship.get_shipment(94911)
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
})*/

function hide_spinner() {
    $('html').removeClass('whirl')
}

jQuery(document).ready(function () {
    // console.log(`document ready`)
    $(document).ajaxStart(function () {
        $('html').addClass('whirl')
    }).ajaxStop(hide_spinner);
})

function serialized_to_object(serialized_array) {
    let object = {}
    for (let name_value of serialized_array) {
        if (typeof name_value !== "object" || ! name_value.hasOwnProperty('name') || ! name_value.hasOwnProperty('value')) {
            continue
        }
        object[name_value.name] = name_value.value
    }
    return object
}