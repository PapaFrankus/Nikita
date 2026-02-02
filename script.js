document.addEventListener('DOMContentLoaded', () => {
    initPoNumber();
    attachEventListeners();
});

let mode = 'BB';

function initPoNumber() {
    let count = parseInt(localStorage.getItem('cnt_v6'), 10);
    if (!Number.isFinite(count)) count = 67962;
    const el = document.getElementById('in_po');
    if (el) el.value = count;
}

function attachEventListeners() {
    document.getElementById('in_customer')?.addEventListener('input', applyCase);
    document.getElementById('btn_bb')?.addEventListener('click', () => setMode('BB'));
    document.getElementById('btn_Bb')?.addEventListener('click', () => setMode('Bb'));

    ['in_price', 'in_delivery', 'in_down'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', calc);
    });

    document.getElementById('btn_fill_demo')?.addEventListener('click', fillDemo);
    document.getElementById('btn_preview')?.addEventListener('click', openPreview);
    document.getElementById('btn_print')?.addEventListener('click', printPDF);
}

function setMode(m) {
    mode = m;
    applyCase();
    const btnBB = document.getElementById('btn_bb');
    const btnBb = document.getElementById('btn_Bb');
    if (btnBB) btnBB.className = m === 'BB' ? 'btn-toggle active' : 'btn-toggle';
    if (btnBb) btnBb.className = m === 'Bb' ? 'btn-toggle active' : 'btn-toggle';
}

function applyCase() {
    const el = document.getElementById('in_customer');
    if (!el) return;
    const cursor = el.selectionStart;
    el.value = mode === 'BB'
        ? el.value.toUpperCase()
        : el.value.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase());
    if (el.setSelectionRange) el.setSelectionRange(cursor, cursor);
}

function format(num) {
    return '$' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

function getFinanceValues() {
    const price = parseFloat(document.getElementById('in_price').value) || 0;
    const delivery = parseFloat(document.getElementById('in_delivery').value) || 0;
    const down = parseFloat(document.getElementById('in_down').value) || 0;
    return {
        price,
        delivery,
        down,
        total: down + delivery
    };
}

function calc() {
    const total = getFinanceValues().total;
    document.getElementById('in_total_due').value = format(total);
    return total;
}


function fitText(el, min = 6) {
    if (!el) return;
    const style = getComputedStyle(el);
    const start = parseFloat(style.fontSize); // Max size in px
    if (!start) return;

    el.style.fontSize = start + 'px';
    el.style.whiteSpace = 'nowrap';
    el.style.display = 'block';

    // If content overflows
    if (el.scrollWidth > el.clientWidth) {
        // Calculate exact ratio needed to fit (percentage based)
        // Multiply by 0.95 for safety buffer
        const ratio = el.clientWidth / el.scrollWidth;
        let newSize = start * ratio * 0.95;

        if (newSize < min) newSize = min;
        el.style.fontSize = newSize + 'px';

        // Fine tuning safety loop
        let i = 0;
        while ((el.scrollWidth > el.clientWidth) && newSize > min && i < 20) {
            newSize -= 0.2;
            el.style.fontSize = newSize + 'px';
            i++;
        }
    }
}

function fitAll() {
    document.querySelectorAll('.fit-text').forEach(el => {
        el.style.fontSize = ''; // Reset to CSS value
        fitText(el, 5); // Allow shrinking down to 5px
    });
}

function fitAllForPrint() {
    const printArea = document.getElementById('print-area');
    if (!printArea) return;
    const prev = {
        display: printArea.style.display,
        position: printArea.style.position,
        left: printArea.style.left,
        top: printArea.style.top,
        visibility: printArea.style.visibility
    };
    printArea.style.display = 'block';
    printArea.style.position = 'absolute';
    printArea.style.left = '-9999px';
    printArea.style.top = '0';
    printArea.style.visibility = 'hidden';

    fitAll();
    // Fit signature specifically
    const sig = document.getElementById('out_salesman_sign');
    if (sig) fitText(sig, 10);

    printArea.style.display = prev.display;
    printArea.style.position = prev.position;
    printArea.style.left = prev.left;
    printArea.style.top = prev.top;
    printArea.style.visibility = prev.visibility;
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}

function syncPrintFields() {
    // Update Document Title with Customer Name
    const customer = document.getElementById('in_customer').value || '';
    document.title = customer ? `Bill Of Sale ${customer}` : 'Bill Of Sale';

    const pad2 = (n) => String(n).padStart(2, '0');
    const { price, delivery, down, total } = getFinanceValues();
    document.getElementById('in_total_due').value = format(total);

    const fields = [
        ['out_po', document.getElementById('in_po').value],
        ['out_salesman', document.getElementById('in_salesman').value],
        ['out_salesman_sig', document.getElementById('in_salesman').value],
        ['out_salesman_sign', document.getElementById('in_salesman').value],
        ['out_customer', document.getElementById('in_customer').value],
        ['out_customer_sig', document.getElementById('in_customer').value],
        ['out_address', document.getElementById('in_address').value],
        ['out_phone', document.getElementById('in_phone').value],
        ['out_email', document.getElementById('in_email').value],
        ['out_city', document.getElementById('in_city').value],
        ['out_zip', document.getElementById('in_zip').value],
        ['out_mfgr', document.getElementById('in_mfgr').value],
        ['out_model', document.getElementById('in_model').value],
        ['out_vin', document.getElementById('in_vin').value],
        ['out_color', document.getElementById('in_color').value],
        ['out_miles', document.getElementById('in_miles').value],
        ['out_price', format(price)]
    ];

    fields.forEach(f => setText(f[0], f[1]));

    const dt = document.getElementById('in_date').value;
    if (dt) {
        const dObj = new Date(dt);
        const s = pad2(dObj.getMonth() + 1) + '/' + pad2(dObj.getDate()) + '/' + dObj.getFullYear();
        setText('out_date', s);
        setText('out_date_sig1', s);
        setText('out_date_sig2', s);
    } else {
        setText('out_date', '');
        setText('out_date_sig1', '');
        setText('out_date_sig2', '');
    }

    setText('out_delivery', delivery > 0 ? format(delivery) : '-');
    setText('out_down', down > 0 ? format(down) : '$0.00');
    setText('out_total_due', format(total));

    fitAllForPrint();
}

function printPDF() {
    syncPrintFields();
    const poInput = document.getElementById('in_po');
    const next = parseInt(poInput.value, 10);

    if (Number.isFinite(next)) {
        localStorage.setItem('cnt_v6', next + 1);
        poInput.value = next + 1;
    }
    window.print();
}

function openPreview() {
    syncPrintFields();
    // Refactored to work with external CSS
    const content = document.getElementById('print-area').innerHTML;
    const win = window.open('', '_blank');
    if (!win) return;

    win.document.open();
    win.document.write(`
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Preview</title>
    <link rel="stylesheet" href="style.css">
    <style>
        body { 
            background: #525659; 
            margin: 0; 
            padding: 20px; 
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: flex-start;
        }
        #print-area { 
            background: #fff; 
            width: 200.3mm; 
            height: 259.3mm; 
            padding: 12mm; 
            overflow: hidden;
            box-sizing: border-box;
            box-shadow: 0 0 15px rgba(0,0,0,0.5);
            display: block !important;
        }
        #form-area { display: none !important; }

        @media print {
            body {
                background: none;
                margin: 0;
                padding: 0;
                display: block;
                min-height: auto;
            }
            #print-area {
                width: auto;
                height: auto;
                margin: 0;
                padding: 0;
                box-shadow: none;
                overflow: visible;
            }
        }
    </style>
</head>
<body>
    <div id="print-area">
        ${content}
    </div>
</body>
</html>`);
    win.document.close();
}

function fillDemo() {
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    setVal('in_salesman', 'Steve Johnson');
    setMode('BB');
    setVal('in_customer', 'Peter John Russell');
    applyCase();
    setVal('in_address', '630 Norwich Rd Salem, CT 06420-3731');
    setVal('in_date', '2025-01-08');
    setVal('in_phone', '(860) 303-6758');
    setVal('in_email', 'rqagnon@ccllchome.com');
    setVal('in_city', 'Salem, CT');
    setVal('in_zip', '06420-3731');
    setVal('in_mfgr', 'Peterbilt');
    setVal('in_model', '2022 Peterbilt 567');
    setVal('in_vin', '1NPCX4EXXND743943');
    setVal('in_color', 'Black');
    setVal('in_miles', '191842');
    setVal('in_price', '94900');
    setVal('in_delivery', '0');
    setVal('in_down', '35000');
    calc();
}