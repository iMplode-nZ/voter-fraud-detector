'use strict';

const input = document.getElementById('submit');
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
