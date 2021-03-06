// รวมฟังก์ชันในระบบ ให้อยู่ในตัวแปรชื่อ utilW [ สามารถใช้บน Worker ได้ ]
var utilW = {

    // *********************** Function หมวดทั่วไป *********************** //

    // เปลี่ยนตัวเลข เป็นตัวอักษรภาษาไทย
    "thaiTextMoney" : function(amount) {
        amount = amount.replace (",", ""); // ไม่ต้องการเครื่องหมายคอมมาร์
        amount = amount.replace (" ", ""); // ไม่ต้องการช่องว่าง
        amount = amount.replace ("บาท", ""); // ไม่ต้องการตัวหนังสือ บาท
        amount = amount.replace ("฿", ""); // ไม่ต้องการสัญลักษณ์สกุลเงินบาท
        return new ThaiMoneyText("บาท","สตางค์").translate(amount);
    },

    // เช็คประเภทตัวแปร
    "checkType" : function(variable) {
        if(Array.isArray(variable)) {
            return 'array';
        }
        return typeof(variable);
    },

    // Copy Object ให้มี Reference ที่ต่างกัน
    "cloneObject" : function(obj) {
        if(obj === null || typeof(obj) !== 'object') {
            return obj;
        }
        var newObj = obj.constructor();
        for(var key in obj) {
            newObj[key] = utilW.cloneObject(obj[key]);
        }
        return newObj;
    },

    // คำนวนความสูงของ Font จากการประเมินขนาด Font
    "fontHeight" : function(fontSize) {
        fontSize = parseInt(fontSize);
        if(fontSize <= 10) {
            return fontSize + 1;
        }
        if(fontSize <= 25) {
            return fontSize + 2;
        }
        if(fontSize >= 25) {
            return fontSize + 3;
        }
        return fontSize;
    },

    // เตรียมชื่อฟ้อนให้เหมาะสม สำหรับใช้ในระบบ canvas
    "canvasFontName" : function(fontName, fontSize, type) {
        if(type === 'b') {
            return 'bold ' + fontSize + 'pt ' + fontName;
        }
        else if(type === 'i') {
            return 'italic ' + fontSize + 'pt ' + fontName;
        }
        else if(type === 'bi') {
            return 'bold italic ' + fontSize + 'pt ' + fontName;
        }
        else {
            return fontSize + 'pt ' + fontName;
        }
    },

    // หาตำแหน่งของหัวกระดาษ
    "findHeaderPage" : function(layoutBodyArray) {
        for(var i = layoutBodyArray.length - 1; i >= 0; i--) {
            if(typeof(layoutBodyArray[i].pageBreak) !== 'undefined') {
                return i;
            }
        }
        return 0;
    },

    // เพิ่ม Object ข้อมูล ลงในเอกสาร สำหรับขนาด A4
    "addToPage_a4" : function(object, nowHeight, body, footerHeight) {
        var objectArray = [];
        var headerPageIndex = utilW.findHeaderPage(body); // หาหัวกระดาษ
        var pageRemainHeight = zpringSize.page['A4'].pageSizePoint.height - footerHeight; // คำนวนขนาดพื้นที่ที่เหลือ

        // ลบขนาดที่เหลือ กับ Object ที่มีอยู่แล้วในกระดาษ
        for(var i = headerPageIndex; i < body.length; i++) {
            pageRemainHeight -= body[i].cal_height;
        }

        // เช็คว่าความสูงของ object เพียงพอต่อขนาดกระดาษที่เหลือหรือไม่
        // ถ้าไม่ให้ ทำการเพิ่ม Header อันใหม่ลงไป แล้วตั้งเป็นหน้ากระดาษใหม่
        if(nowHeight > pageRemainHeight) {
            var newHeader = utilW.cloneObject(body[headerPageIndex]);
            newHeader.pageBreak = 'before';
            objectArray.push(newHeader);
        }
        
        // เพิ่ม Object ข้อมูล ลงในเอกสาร
        objectArray.push(object);
        return objectArray;
    },

    // *********************** Function หมวดแปลงข้อมูล ให้เข้ากับ Pattern ของ PDFMake *********************** //
    
    // --- หมวดที่เกี่ยวกับ Array
    
    // เพิ่ม attribute ใส่ใน object แต่ละตัวใน array
    "pat_add_attr_array" : function(array, attr) {
        for(index in array) {
            array[index] = utilW.pat_add_attr(array[index], attr);
        }
        return array;
    },

    // --- หมวดที่เกี่ยวกับ Object

     // เพิ่ม attribute ใส่ใน object
    "pat_add_attr" : function(text, attr) {
        if(utilW.checkType(text) === 'object') {
            var textObject = text;
        }
        else {
            var textObject = {text : text};
        }

        for(a in attr) {
            text[a] = attr[a];
        }
        return textObject;
    },

    // Map ระหว่าง Value กับ Label เป็น Object เดียวกัน
    "pat_add_label" : function(data) {
        if(data.hasOwnProperty('label') && data.hasOwnProperty('value')) {
            return { text: [data.label, ' ', data.value] }
        }
        else {
            return data;
        }
    },

    // Map ระหว่าง Value กับ Label เป็น Object เดียวกัน ในรูปแบบของ ตาราง 2 columns
    "pat_add_label_table2c" : function(data) {
        if(data.hasOwnProperty('label') && data.hasOwnProperty('value')) {
            return [data.label, data.value];
        }
        else {
            return [data, ''];
        }
    },

    // --- หมวดทั่วไป

    // สร้่างเส้นตรง โดยรับความยาวของเส้น กับ options ที่จะใส่เพิ่มลงไป
    "hrLine" : function(width, options) {
        // สร้างเส้นเป็น canvas กว้าง 1 pt | สี #AAA
        var lineData = { canvas: [{ type: 'line', x1: 0, y1: 0, x2: width, y2: 0, lineWidth: 1,  color: '#AAA' }]};
        var lineHeight = 1;
        for(option in options) {
            lineData[option] = options[option];
            // คำนวนความสูงของเส้น
            if(option === 'margin') {
                if(options[option].length === 2) {
                    lineHeight += options[option][1];
                    lineHeight += options[option][1];
                }
                else {
                    lineHeight += options[option][1];
                    lineHeight += options[option][3];
                }
            }
        }
        lineData.cal_height = lineHeight;
        return lineData;
    },

    "spaceLine" : function(height) {
        var lineData = { canvas : [] };
        lineData.margin = [0, height / 2];
        lineData.cal_height = height;
        return lineData;
    },

    // *********************** Function หมวดสร้าง Layout ที่ใช้ใน PDFMake สำหรับขนาด A4 *********************** //

    // ฟังก์ชั่นใช้สำหรับสร้าง Header ในระบบเอกสาร A4
    "header_a4" : function(size, data, font) {
        var headerObject = {
            columns : [
                {
                    width: size.location.width,
                    text : ''
                },
                {
                    width: size.blank.width,
                    text : ' ',
                },
                {
                    width: size.doc.width,
                }
            ],
            margin : [0, 0, 0, 20] // เว้นระยะข้างล่าง Header 20 points
        };

        // สร้าง Stack สำหรับช่องแรก
        var locationStack = [];

        // สร้าง Part 1 ในช่องแรก
        var shopName = utilB.spaceToArray(data.location.shop['name'].text, size.location.width, font.canvasFont());
        delete data.location.shop['name'].text;
        data.location.shop['name'] = utilW.pat_add_attr_array(shopName ,data.location.shop['name']);
        data.location.shop['address'] = utilB.textToArray(data.location.shop['address'].text, size.location.width, font.canvasFont());
        data.location.shop['website'] = utilB.charToArray(data.location.shop['website'].text, size.location.width, font.canvasFont()); 
        for(var info in data.location.shop) {
            data.location.shop[info] = utilW.pat_add_label(data.location.shop[info]);
            if(utilW.checkType(data.location.shop[info]) === 'object') {
                data.location.shop[info].cal_height = utilW.fontHeight(font.size);
            }
            locationStack.push(data.location.shop[info]);
        }

        // เพิ่มช่องว่างระหว่าง Part
        locationStack.push({
            text : ' ',
            cal_height : utilW.fontHeight(font.size)
        });

        // สร้าง Part 2 ในช่องแรก
        data.location.seller['address'] = utilB.textToArray(data.location.seller['address'].text, size.location.width, font.canvasFont());
        for(var info in data.location.seller) {
            data.location.seller[info] = utilW.pat_add_label(data.location.seller[info]);
            if(utilW.checkType(data.location.seller[info]) === 'object') {
                data.location.seller[info].cal_height = utilW.fontHeight(font.size);
            }
            locationStack.push(data.location.seller[info]);
        }

        // คำนวนความสูงของช่องแรก
        var locationHeight = 0;
        locationStack.forEach(function(obj) {
            if(utilW.checkType(obj) === 'object') {
                locationHeight += obj.cal_height;
            }
            else {
                obj.forEach(function(eachLine) {    
                    locationHeight += eachLine.height;
                });
            }
        });

        // เพิ่ม Stack ที่ทำไว้ลงในช่องแรก พร้อมระบุความสูง
        headerObject.columns[0].stack = locationStack;
        headerObject.columns[0].cal_height = locationHeight;

        // สร้าง Stack สำหรับช่องที่ 3
        var docStack = [];

        // เพิ่ม Label ของช่อง
        data.doc.label.style.forEach(function(style) {
            if(zpringStyle[style].fontSize) {
                data.doc.label.cal_height = utilW.fontHeight(zpringStyle[style].fontSize);
            }
        });
        docStack.push(data.doc.label);

        // เพิ่มเส้นตรง
        docStack.push(utilW.hrLine(size.doc.width, { margin: [0, 10], colSpan: 2 }));

        // สร้างตาราง เพื่อนำไปใส่ Stack
        var docTable = [];

        // สร้าง Part 1 ในตาราง
        data.doc.part1.sellerName.value = utilB.spaceToArray(data.doc.part1.sellerName.value.text, size.doc.value.width,font.canvasFont());
        for(var info in data.doc.part1) {
            data.doc.part1[info] = utilW.pat_add_label_table2c(data.doc.part1[info]);
            if(utilW.checkType(data.doc.part1[info][1]) === 'object') {
                data.doc.part1[info][1].cal_height = utilW.fontHeight(font.size);
            }
            data.doc.part1[info][0].margin = [15, 0, 0, 0];
            data.doc.part1[info][0].alignment = 'left';
            docTable.push(data.doc.part1[info]);
        }

        // เพิ่มเส้นตรง
        docTable.push([utilW.hrLine(size.doc.width, { margin: [0, 10], colSpan: 2 }), '']);

        // สร้าง Part 2 ในตาราง
        data.doc.part2.workName.value = utilB.textToArray(data.doc.part2.workName.value.text, size.doc.value.width,font.canvasFont());
        data.doc.part2.contactName.value = utilB.spaceToArray(data.doc.part2.contactName.value.text, size.doc.value.width,font.canvasFont());
        data.doc.part2.email.value = utilB.charToArray(data.doc.part2.email.value.text, size.doc.value.width, font.canvasFont());
        for(var info in data.doc.part2) {
            data.doc.part2[info] = utilW.pat_add_label_table2c(data.doc.part2[info]);
            if(utilW.checkType(data.doc.part2[info][1]) === 'object') {
                data.doc.part2[info][1].cal_height = utilW.fontHeight(font.size);
            }
            data.doc.part2[info][0].margin = [15, 0, 0, 0];
            data.doc.part2[info][0].alignment = 'left';
            docTable.push(data.doc.part2[info]);
        }

        // เพิ่มตารางที่ทำไว้ ลงใน Stack
        docStack.push({
            table: {    
                widths: [ size.doc.label.width, size.doc.value.width ],
                body: docTable
            },
            layout: {
                vLineWidth : function() { return 0; },
                hLineWidth : function() { return 0; },
                paddingLeft : function() { return 0; },
                paddingRight : function() { return 0; },
                paddingTop : function() { return 0.5; },
                paddingBottom : function() { return 0.5; }
            }
        });

        // คำนวนความสูงของช่องที่สาม
        var docHeight = 0;
        docHeight += docStack[0].cal_height;
        docHeight += docStack[1].cal_height;
        docTable.forEach(function(array) {
            if(typeof(array[1]) === 'object') {
                if(utilW.checkType(array[1]) === 'object') {
                    docHeight += array[1].cal_height;
                }
                else {
                    array[1].forEach(function(line) {
                        docHeight += line.height;
                    });
                }
            }
            else {
                docHeight += array[0].cal_height;
            }
            docHeight += 1; // เพิ่มความสูงจาก Padding ของแต่ละ แถว
        });

        // เพิ่ม Stack ที่ทำไว้ลงในช่องที่สาม พร้อมความสูง
        headerObject.columns[2].stack = docStack;
        headerObject.columns[2].cal_height = docHeight;

        // เปรียบเทียบความสูงระหว่างช่องที่ 1 กับช่องที่ 3 แล้วตั้งเป็นความสูงของ Header
        headerObject.cal_height = (headerObject.columns[0].cal_height > headerObject.columns[2].cal_height ? headerObject.columns[0].cal_height : headerObject.columns[2].cal_height) + headerObject.margin[3] // บวกค่าที่เว้นระยะข้างล่าง ลงไปในความสูงด้วย;
        return headerObject;
    },
    

    // ฟังก์ชั่นใช้สำหรับสร้างตาราง Order ขนาด A4
    "orderTable_a4" : function(size, label, data, font, header, footerHeight) {
      
        // สร้าง Object ของ Table
        var tableObject = {
            table : {
                widths: [size.no.width, size.detail.width, size.quantity.width, size.pricePerUnit.width, size.totalPrice.width],
                body : [
                    [label.no, label.detail, label.quantity, label.pricePerUnit, label.totalPrice],
                ]
            },
            layout : {
                paddingTop : function() { return 2; },
                paddingBottom : function() { return 2; },
                paddingLeft : function() { return 4; },
                paddingRight : function() { return 4; },
                vLineWidth : function() { return 0; },
                hLineColor : function() { return '#AAA'; }
            }
        };
        tableObject.table.body[0][1].cal_height = utilW.fontHeight(font.size) + tableObject.layout.paddingTop() + tableObject.layout.paddingBottom();
        
        // จัดข้อมูลในอยู่ใน Pattern ของตาราง
        var orderList = [];
        data.forEach(function(data) {
            data.no.alignment = 'center';
            var quantity = {text : [data.quantity.amount, ' ', data.quantity.unit], alignment : 'center'};
            data.price.unit.text = parseFloat(data.price.unit.text).toFixed(2);
            data.price.unit.alignment = 'right';
            data.price.total = { text: parseFloat(data.price.total.text).toFixed(2), alignment : 'right' };
            orderList.push([
                data.no, 
                {
                    stack : [
                        utilW.pat_add_attr_array(utilB.textToArray(data.detail.name.text, size.detail.width, font.canvasFont('b')), {bold : true}),
                        utilB.textToArray(data.detail.description.text, size.detail.width, font.canvasFont())
                    ],
                    alignment : 'left'
                },
                quantity,
                data.price.unit,
                data.price.total
            ]);
        });

        // คำนวนความสูงของแต่ละ Order
        orderList.forEach(function(order) {
            var height = 0;
            order[1].stack.forEach(function(stack) {
                stack.forEach(function(obj) {
                    height += obj.height;
                });
            });
            order[1].cal_height = height;
        });


        // คำนวนความสูงของหน้า
        var bodyHeight = zpringSize.page['A4'].pageSizePoint.height - header.cal_height - footerHeight;
        var tableObjectArray = [];
        var tableTemp = utilW.cloneObject(tableObject);
        // ใส่ Order ไปในแต่ละหน้า ให้สัมพันธ์กบความสูงที่เหลือ
        orderList.forEach(function(order, index) {

            var nowHeight = 0;
            tableTemp.table.body.forEach(function(row) {
                nowHeight += row[1].cal_height;
            });

            // ถ้าความสูงเกินขนาดที่เหลือ ให้แยกตารางใหม่
            if(order[1].cal_height + nowHeight > bodyHeight) {
                tableTemp.cal_height = nowHeight; // คำนวนความสูงของตาราง
                tableObjectArray.push(tableTemp);
                tableTemp = utilW.cloneObject(tableObject);
                nowHeight = 0;
            }

            tableTemp.table.body.push(order);

            if(index === orderList.length - 1) {
                tableTemp.cal_height = nowHeight + order[1].cal_height; // คำนวนความสูงของตาราง
                tableObjectArray.push(tableTemp);
            }

        });

        // สร้างข้อมูล Body ของเอกสาร
        var bodyOrderArray = [];

        tableObjectArray.forEach(function(table, index) {
            var newHeader = utilW.cloneObject(header);
            if(index > 0) {
                newHeader.pageBreak = 'before'; // แต่ละ Header ใหม่จะต้องเริ่มหน้าใหม่
            }
            bodyOrderArray.push(utilW.cloneObject(newHeader)); // เพิ่มตารางให้แต่ละ Table
            bodyOrderArray.push(table);
        });

        return bodyOrderArray;
    },

    // ฟังก์ชั่นใช้สำหรับสร้าง ตารางสรุปยอดเงิน สำหรับขนาด A4
    "total_a4" : function(size, data, font, body, footerHeight) {
        // สร้าง Object ที่เป็น column
        var totalObject = {
            columns : [
                {},
                {
                    width : size.digit.width,
                    stack : [
                        {
                            table : {
                                widths : [size.digit.label.width, size.digit.value.width],
                                body: []
                            },
                            alignment: 'right',
                            layout : {
                                paddingTop: function() { return 0.5; },
                                paddingBottom: function() { return 0.5; },
                                paddingLeft: function() { return 0; },
                                paddingRight: function() { return 0; },
                                vLineWidth : function() { return 0; },
                                hLineWidth : function() { return 0; }
                            }
                        }
                    ]
                }
            ],
            margin : [0, 10]
        };

        // เพิ่มตัวหนังสือภาษาไทย ลงในฝั่งซ้าย
        data.letter.width = size.letter.width;
        totalObject.columns[0] = data.letter;

        // เพิ่มสรุปยอดเงินแบบไม่คิดภาษี
        for(var info in data.digit.noTax) {
            data.digit.noTax[info].value.cal_height = utilW.fontHeight(font.size);
            totalObject.columns[1].stack[0].table.body.push(utilW.pat_add_label_table2c(data.digit.noTax[info]));
        }

        // เพิ่มเส้นขั้นระหว่าง คิดภาษี กับไม่คิดภาษี
        totalObject.columns[1].stack[0].table.body.push([utilW.hrLine(size.digit.width, { margin: [0, 10], colSpan: 2 }), '']);

        // เพิ่มสรุปยอดเงินแบบไม่คิดภาษี
        for(var info in data.digit.withTax) {
            data.digit.withTax[info].value.cal_height = utilW.fontHeight(font.size);
            totalObject.columns[1].stack[0].table.body.push(utilW.pat_add_label_table2c(data.digit.withTax[info]));
        }

        // คำนวนความสูงของตารางทั้งหมด
        var totalHeight = 0;
        totalObject.columns[1].stack[0].table.body.forEach(function(array) {
            if(utilW.checkType(array[1]) !== 'object') {
                totalHeight += array[0].cal_height;
            }
            else {
                totalHeight += array[1].cal_height;
            }
        });

        // คำนวน ระยะห่างทางซ้าย โดยจัดให้อยู่ตรงกลางของฝั่งขวา
        var remainHeight = (totalHeight - utilW.fontHeight(font.size)) / 2;
        totalObject.columns[0].margin = [0, remainHeight, 0, remainHeight];
        
        totalHeight += totalObject.margin[1]; // บวกระยะห่างของ ตารางลงไปด้วย
        totalObject.cal_height = totalHeight;
        
        return utilW.addToPage_a4(totalObject, totalHeight, body, footerHeight); // นำข้อมูลที่เสร็จแล้วลงไปใน Body
    },

    // ฟังก์ชั่นใช้สำหรับสร้าง ตารางหมายเหตุ สำหรับขนาด A4
    "note_a4" : function(size, data, font, body, footerHeight) {
        // สร้าง Object ของหมายเหตุ
        var noteObject = {};
        noteObject.margin = [0, 10]; // กำหนดระยะห่าง ของตาราง
        data.description.label.cal_height = utilW.fontHeight(font.size);
        data.description.value = utilB.textToArray(data.description.value.text, size.width, font.canvasFont());
        noteObject.stack = [
            data.description.label,
            data.description.value
        ];

        // คำนวนความสูง
        var noteHeight = 0;
        data.description.value.forEach(function(line) {
            noteHeight += line.height;
        });

        noteHeight += data.description.label.cal_height;
        noteHeight += noteObject.margin[1]; // บวกระยะห่างของ ตารางลงไปด้วย
        noteObject.cal_height = noteHeight;

        return utilW.addToPage_a4(noteObject, noteHeight, body, footerHeight);  // นำข้อมูลที่เสร็จแล้วลงไปใน Body
    },

    // ฟังก์ชั่นใช้สำหรับสร้างตาราง ลายเซนต์ ในระบบเอกสาร A4
    "signature_a4" : function(size, data, font, body, footerHeight) {
        // สร้างตารางของลายเซนต์
        var signatureObject = {
            table : {
                widths : [size.buyer.signature, size.buyer.date, size.blank, size.seller.signature, size.seller.date],
                body : []
            },
            layout : {
                paddingTop: function() { return 0; },
                paddingBottom: function() { return 0; },
                paddingLeft: function() { return 7.5; },
                paddingRight: function() { return 7.5; },
                vLineWidth : function() { return 0; },
                hLineWidth : function() { return 0; }
            }
        };

        // ใส่ชื่อผู้ขายลง ทางขวา
        var sellerShopName = utilW.pat_add_label(data.seller.shop.name);
        sellerShopName.colSpan = 5;
        sellerShopName.alignment = 'right';
        sellerShopName.margin = [0, 0, 0, 40];
        signatureObject.table.body.push([sellerShopName, '', '', '', '']);

        // เพิ่มช่องลายเซนต์ ด้านคนซื้อ
        var signHrRow = [];
        var signNameRow = [];
        for(var info in data.buyer) {
            signHrRow.push(utilW.hrLine(size.buyer[info].width, { margin : [0, 0, 0, 7] }));
            data.buyer[info].label.alignment = 'center';
            signNameRow.push(data.buyer[info].label);
        }

        // เพิ่มช่องว่างระหว่างกลาง
        signHrRow.push('');
        signNameRow.push('');

        // เพิ่มช่องลายเซนต์ ด้านคนขาย
        for(var info in data.seller.owner) {
            signHrRow.push(utilW.hrLine(size.seller[info].width, { margin : [0, 0, 0, 7] }));
            data.seller.owner[info].label.alignment = 'center';
            signNameRow.push(data.seller.owner[info].label);
        }

        // นำลายเซนต์และ ข้อความระบุใส่ในตาราง
        signatureObject.table.body.push(signHrRow);
        signatureObject.table.body.push(signNameRow);

        // คำนวนความสูงของ ตาราง
        var signatureHeight = 0;
        signatureHeight += utilW.fontHeight(font.size); // ความสูงของตัวอักษรปกติ [ส่วนชื่อผู้ขาย]
        signatureHeight += sellerShopName.margin[3]; // ระยะห่างระหว่างช่องเซนต์ กับส่วนแสดงชื่อผู้ขาย

        signatureHeight += signatureObject.table.body[1][0].cal_height; // ความสูงของ ขีดใส่ลายเซนต์

        signatureHeight += utilW.fontHeight(font.size); // ความสูงของตัวอักษรปกติ [ส่วนแสดงชื่อช่องที่เซนต์]

        // ทำการเพิ่ม Object ของลายเซนต์ลงใน body
        var signatureObjectArray = [];
        var headerPageIndex = utilW.findHeaderPage(body);
        var pageRemainHeight = zpringSize.page['A4'].pageSizePoint.height - footerHeight;

        // คำนวนความสูงของ Object ทั้งหมดในเอกสารตอนนี้
        for(var i = headerPageIndex; i < body.length; i++) {
            pageRemainHeight -= body[i].cal_height;
        }

        // ใช้ในการกำหนดระยะห่าง ของช่องเซนต์ เพื่อให้อยู่ด้านล่างสุด
        var space = 0;

        // ถ้าความสูงที่เหลือของกระดาษ ไม่พอใส่ช่องลายเซนต์ ให้เปิดหน้าใหม่พร้อม Header
        if(signatureHeight > pageRemainHeight) {
            var newHeader = utilW.cloneObject(body[headerPageIndex]);
            newHeader.pageBreak = 'before';
            signatureObjectArray.push(newHeader);
            space = zpringSize.page['A4'].pageSizePoint.height - footerHeight - newHeader.cal_height - signatureHeight; // สูตรที่ใช้คำนวนเพื่อให้ ช่องเซนต์อยู่ล่างสุดของกระดาษ
        }
        else {
            space = pageRemainHeight - signatureHeight - 10; // สูตรที่ใช้คำนวนเพื่อให้ ช่องเซนต์อยู่ล่างสุดของกระดาษ
        }

        signatureObject.margin = [0, space, 0, 0];
        signatureObjectArray.push(signatureObject);

        return signatureObjectArray;
    },

    // ฟังก์ชั่นใช้สำหรับสร้าง Footer สำหรับขนาด A4
    "footer_a4" : function(size, data, font, currentPage, totalPage) {
        data.page.number.value = { text : currentPage + ' / ' + totalPage }; // สร้างตัวหนังสือบอกจำนวนหน้า
        var footerHeight = utilW.fontHeight(font.size); // กำหนดความสูงของ Footer ให้เท่ากับขนาดตัวหนังสือปกติ
        var footerObject = utilW.pat_add_label(data.page.number); // Map ข้อมูลกับ Label
        size.height = zpringSize.page['A4'].pageMargin.bottom + footerHeight; // กำหนดความสูงของ Footer ทั้งหมด ให้เท่ากับระยะขอบกระดาษ บวกความสูงของ Footer
        footerObject.margin = [zpringSize.page['A4'].pageMargin.left, 0, zpringSize.page['A4'].pageMargin.right, zpringSize.page['A4'].pageMargin.bottom]; // กำหนดระยะขอบของ Footer [Footer จะไม่อิงระยะตาม ระบบกระดาษปกติ ต้องกำหนดแยก !!]
        return footerObject;
    },

    // *********************** Function หมวดสร้าง Layout ที่ใช้ใน PDFMake สำหรับขนาด 80m *********************** //
    
    // ฟังก์ชั่นใช้สำหรับสร้าง Header ขนาด 80m
    "header_80m" : function(size, data, font) {

        // สร้าง Object ของ Header เป็นแบบ column
        var headObject = {
            columns : [],
            alignment : 'center'
        };

        // กำหนดความกว้างของ Logo
        data.head.logo.width = size.head.logo.width;
        headObject.columns.push(data.head.logo);

        // เพิ่มหัวกระดาษ
        var headDetail = { stack : [] };
        headDetail.width = size.head.detail.width;
        headDetail.stack.push(data.head.detail.label);
        headDetail.stack.push(data.head.detail.receiptTaxID.label);
        headDetail.stack.push(data.head.detail.receiptTaxID.value);
        headObject.columns.push(headDetail);

        // คำนวนความสูงของหัวกระดาษ
        var headDetailHeight = 0;
        headDetailHeight += utilW.fontHeight(font.size);
        headDetailHeight += utilW.fontHeight(font.size);
        headDetailHeight += utilW.fontHeight(font.size);

        // เช็คว่าขนาดโลโก้ กับหัวกระดาษ อะไรสูงกว่ากัน ถ้าสูงกว่าต้องเติม margin เพื่อให้มันอยู่ตรงกลาง / และกำหนด ความสูงของทั้งเซต เป็นตัวที่มากกว่านั้น
        if(headDetailHeight < size.head.logo.height) {
            headDetail.margin = [0, (size.head.logo.height - headDetailHeight) / 2];
            headObject.cal_height = size.head.logo.height;
        }
        else {
            data.head.logo.margin = [0, (headDetailHeight - size.head.logo.height) / 2];
            headObject.cal_height = headDetailHeight;
        }

        // สร้าง Object ของข้อมูล เป็น column
        var infoObject = {
            columns : []
        };

        // Object ฝั่งข้อมูลบริษัท
        var company = { stack : [], cal_height : 0 };
        company.width = size.info.company.width;
        var companyName = utilB.textToArray(data.info.company.name.text, size.info.company.width, font.canvasFont());
        company.stack.push(companyName);
        company.stack.push(data.info.company.taxID.label);
        company.stack.push(data.info.company.taxID.value);

        // คำนวนความสูงของ ตาราง company
        companyName.forEach(function(line) {
            company.cal_height += line.height; // ชื่อบริษัท
        });
        company.cal_height += utilW.fontHeight(font.size); // เลขภาษี label
        company.cal_height += utilW.fontHeight(font.size); // เลขภาษี value
    
        // Object ฝั่งข้อมูลใบเสร็จ
        var receipt = { stack : [], cal_height : 0 };
        receipt.width = size.info.receipt.width;
        data.info.receipt.employee.value = utilB.charCut(data.info.receipt.employee.label.text + ' ' + data.info.receipt.employee.value.text, size.info.receipt.width, font.canvasFont());
        
        // ถ้า POSID ยาวเกินขอบกระดาษ ให้ตั้งบรรทัดใหม่
        if(utilB.textSize(data.info.receipt.posID.label.text + ' ' + data.info.receipt.posID.value.text, font.canvasFont()).width > size.info.receipt.width) {
            receipt.stack.push(data.info.receipt.posID.label);
            receipt.cal_height += utilW.fontHeight(font.size);
            var posIDArray = utilB.textToArray(data.info.receipt.posID.value.text, size.info.receipt.width, font.canvasFont());
            receipt.stack.push(posIDArray);
            posIDArray.forEach(function(line) {
                receipt.cal_height += line.height;
            });
        }
        else {
            receipt.stack.push(utilW.pat_add_label(data.info.receipt.posID));
            receipt.cal_height += utilW.fontHeight(font.size);
        }
        
        // ใส่ข้อมูล พนักงานและวันเวลา
        receipt.stack.push(data.info.receipt.employee.value);
        receipt.stack.push(data.info.receipt.dateTime.value);

        // เพิ่มความสูงของพนักงานและวันเวลา
        receipt.cal_height += utilW.fontHeight(font.size);
        receipt.cal_height += utilW.fontHeight(font.size);

        // เลือกความสูง ของกรอบ info
        infoObject.cal_height = company.cal_height > receipt.cal_height ? company.cal_height : receipt.cal_height;

        infoObject.columns.push(company);
        infoObject.columns.push(receipt);

        // เพิ่มข้อมูลงหัวกระดาษ
        var headerArray = [];
        headerArray.push(headObject);
        var spaceLine = utilW.spaceLine(10);
        headerArray.push(spaceLine);
        headerArray.push(infoObject);

        // สรุปความสูงของหัวกระดาษ
        var headerHeight = 0;
        headerHeight += headObject.cal_height;
        headerHeight += spaceLine.cal_height;
        headerHeight += infoObject.cal_height;

        return { stack : headerArray, cal_height : headerHeight };
    },

    // ฟังก์ชั่นใช้สำหรับสร้างตาราง Order สำหรับขนาด 80m
    "orderTable_80m" : function(size, data, font)  {
        var orderTableObject = {
            table : {
                widths : [size.detail.width, size.quantity.width, size.price.unit.width, size.price.total.width],
                body : [
                    [data.label.detail, data.label.quantity, data.label.price.unit, data.label.price.total]
                ]
            },
            layout : {
                vLineWidth : function() { return 0; },
                hLineWidth : function() { return 0; },
                paddingTop : function() { return 0; },
                paddingBottom : function() { return 0; },
                paddingLeft : function() { return 0; },
                paddingRight : function() { return 0; }
            },
            cal_height : 0
        };
        // ใส่ข้อมูลลงกระดาษ
        data.orderList.forEach(function(order) {
            order.detail.name = utilB.charCut(order.detail.name.text, size.detail.width, font.canvasFont());
            orderTableObject.table.body.push([order.detail.name, order.quantity.amount, order.price.unit, order.price.total]);
        });
        // นับความสูง
        orderTableObject.cal_height += utilW.fontHeight(font.size);
        data.orderList.forEach(function(order) {
            orderTableObject.cal_height += order.detail.name.height;
        });

        return orderTableObject;
    },

    // ฟังก์ชั่นใช้สำหรับสร้างตาราง Total สำหรับกระดาษขนาด 80m
    "total_80m" : function(size, data, font) {
        var totalObject = {
            table : {
                widths : [size.label.width, size.value.width],
                body : []
            },
            layout : {
                vLineWidth : function() { return 0; },
                hLineWidth : function() { return 0; },
                paddingTop : function() { return 0; },
                paddingBottom : function() { return 0; },
                paddingLeft : function() { return 20; },
                paddingRight : function() { return 0; }
            },
            cal_height : 0
        };

        data.total.label.text = data.quantity.amount.text + ' ' + data.quantity.unit.text + '  ' + data.total.label.text;
        for(var info in data) {
            if(info === 'quantity') {
                continue;
            }
            data[info].value.alignment = 'right';
            totalObject.table.body.push(utilW.pat_add_label_table2c(data[info]));
            totalObject.cal_height += utilW.fontHeight(font.size);
        }

        return totalObject;
    },

    // ฟังก์ชั่นใช้สำหรับสร้าง Footer สำหรับกระดาษ ขนาด 80m
    "footer_80m" : function(width, data, font) {
        var footerObject = { stack : [], cal_height : 0 }
        // แยกแต่ละคำเป็นบรรทัดด้วย \n
        data.text.split('\n').forEach(function(line) {
            // แยกบรรทัดเป็นหลายบรรทัด ถ้าข้อความยาวเกินไป
            utilB.textToArray(line, width, font.canvasFont()).forEach(function(l) {
                l.alignment = 'center';
                footerObject.stack.push(l);
                footerObject.cal_height += l.height;
            });
        });
        
        return footerObject;
    }

};