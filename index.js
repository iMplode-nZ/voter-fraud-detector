'use strict';

const input = document.createElement('input');
input.type = 'file';
input.style.display = 'none';
document.body.appendChild(input);
input.click();
input.onchange = () => {
    console.log('Loading File...');
    const file = input.files[0];
    if (! file.name.endsWith('.csv')) {
        throw new Error('Invalid File. Only `.csv` files are supported.');
    }
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = (e) => {
        console.log(e);
        const voters = reader.result;
        window.voters = voters;
    }
}
