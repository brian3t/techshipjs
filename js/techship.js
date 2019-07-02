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
        const base_url = TECHSHIP_CONFIG.root + '/get_labelary/'
        try {
            let raw_zpl = window.atob(raw_zpl_encoded)
            $.ajax({
                url: base_url + raw_zpl_encoded,
                method: 'GET',
                // contentType: 'application/x-www-form-urlencoded',
                // headers: {  },//expect png
                // headers: { 'Accept': 'application/pdf' },//expect pdf
                // dataType: 'image/png',
                // dataType: 'text',
                // data: raw_zpl,
                // data: '^XA\\r\\n\\r\\n^FX Top section with company logo, name and address.\\r\\n^CF0,60\\r\\n^FO50,50^GB100,100,100^FS\\r\\n^FO75,75^FR^GB100,100,100^FS\\r\\n^FO88,88^GB50,50,50^FS\\r\\n^FO220,50^FDInternational Shipping, Inc.^FS\\r\\n^CF0,40\\r\\n^FO220,100^FD1000 Shipping Lane^FS\\r\\n^FO220,135^FDShelbyville TN 38102^FS\\r\\n^FO220,170^FDUnited States (USA)^FS\\r\\n^FO50,250^GB700,1,3^FS\\r\\n\\r\\n^FX Second section with recipient address and permit information.\\r\\n^CFA,30\\r\\n^FO50,300^FDJohn Doe^FS\\r\\n^FO50,340^FD100 Main Street^FS\\r\\n^FO50,380^FDSpringfield TN 39021^FS\\r\\n^FO50,420^FDUnited States (USA)^FS\\r\\n^CFA,15\\r\\n^FO600,300^GB150,150,3^FS\\r\\n^FO638,340^FDPermit^FS\\r\\n^FO638,390^FD123456^FS\\r\\n^FO50,500^GB700,1,3^FS\\r\\n\\r\\n^FX Third section with barcode.\\r\\n^BY5,2,270\\r\\n^FO175,550^BC^FD1234567890^FS\\r\\n\\r\\n^FX Fourth section (the two boxes on the bottom).\\r\\n^FO50,900^GB700,250,3^FS\\r\\n^FO400,900^GB1,250,3^FS\\r\\n^CF0,40\\r\\n^FO100,960^FDShipping Ctr. X34B-1^FS\\r\\n^FO100,1010^FDREF1 F00B47^FS\\r\\n^FO100,1060^FDREF2 BL4H8^FS\\r\\n^CF0,190\\r\\n^FO485,965^FDCA^FS\\r\\n\\r\\n^XZ\\r\\n',
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
        if (! json_ship || typeof json_ship !== 'object' || ! (json_ship.BatchNumber)) {
            return console.error(`bad json ship data`);
        }
        /*
         <tr>
                                    <td>6</td>
                                    <td><img
                                            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mO8Vw8AAkEBX6r220kAAAAASUVORK5CYII="
                                            alt=""/></td>
                                    <td>Quality Bol pen</td>
                                    <td>
                                        <button class="ps-setting">Paused</button>
                                    </td>
                                    <td>Java</td>
                                    <td>CSE</td>
                                    <td>CD</td>
                                    <td>$1000</td>
                                    <td>
                                        <button data-toggle="tooltip" title="Edit" class="pd-setting-ed"><i class="fa fa-pencil-square-o"
                                                                                                            aria-hidden="true"></i></button>
                                        <button data-toggle="tooltip" title="Trash" class="pd-setting-ed"><i class="fa fa-trash-o"
                                                                                                             aria-hidden="true"></i></button>
                                    </td>
                                </tr>
         */
        let tr = $('<tr></tr>')
        let first_package = json_ship.Packages.pop()
        let first_tracking_id = first_package.TrackingNumber || 'N/A'
        let first_label = first_package.Labels.pop()
        let label_raw = first_label.Label

        tr.append(`<td class="shipment_id">${json_ship.Id}</td>`)
            .append(`<td>${json_ship.BatchNumber}</td>`).append(`<td>${json_ship.ManifestId}</td>`)
            .append(`<td>${json_ship.ClientCode}</td>`).append(`<td>${json_ship.CarrierCode}</td>`).append(`<td>${json_ship.TransactionNumber}</td>`)
            .append(`<td>${json_ship.ShipToName}</td>`).append(`<td>${json_ship.ShipToCity}</td>`).append(`<td>${first_tracking_id}</td>`)
            .append(`<td class="zpl"></td>`)
            .append(`<td class="img"></td>`)
            .append(`<td class="pdf"></td>`)

        $('#shipment_table').append(tr)
        if (first_label.Type === 2) {//ZPL
            this.get_img_fr_labelary(first_label.Label, json_ship.Id)
        }
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
