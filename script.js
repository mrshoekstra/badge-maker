import { DropZone } from './modules/DropZone.js';

const imageInput = document.getElementById('imageInput');
//const jsonInput = document.getElementById('jsonInput');
const badgeHueInput = document.getElementById('badgeHueInput');
const iconStyleInput = document.getElementById('iconStyleInput');
const iconNumberInput = document.getElementById('iconNumberInput');
const iconHueInput = document.getElementById('iconHueInput');
const textTopInput = document.getElementById('textTopInput');
const textBottomInput = document.getElementById('textBottomInput');
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
//const saveJsonButton = document.getElementById('saveJson');
const exportPngButton = document.getElementById('exportPng');
const defaultValue = {
	badgeHue: 222,
	iconHue: 69,
	iconNumber: 1,
	iconStyle: 'number',
	textBottom: 'Completed 1 Level',
	textTop: 'BADGE CONFIGURATION',
};

let badgeHue,
    iconHue,
    iconNumber,
    iconStyle,
    image,
    svgTemplate,
    textBottom,
    textTop;

function loadTemplate() {
	fetch('assets/badge.svg')
	.then(response => {
		if (!response.ok) throw new Error('Error loading badge template');
		return response.text();
	})
	.then(data => {
		svgTemplate = data;
		updatePreview();
	})
	.catch(error => {
		console.error(error);
	});
}

function download() {
	// File name
	const icon = iconStyleInput[iconStyleInput.selectedIndex].text + (
		iconStyle === 'number'
			? ` ${iconNumber}`
			: ''
	);
	const separator = textTop.trim() !== '' && textBottom.trim() !== ''
		? ' - '
		: '';
	const fileName = `${textTop}${separator}${textBottom} (${icon}).png`
	let dataUrl = canvas.toDataURL('image/png');
	dataUrl = dataUrl.replace(
		/^data:image\/[^;]*/,
		`data:application/octet-stream;headers=Content-Disposition%3A%20attachment%3B%20filename=${fileName}.png`,
	);
	// Download
	let link = document.createElement('a');
	link.download = fileName;
	link.href = dataUrl;
	link.click();
}

function hexToOklchHue(hex) {
	if (!/^#?[0-9a-fA-F]{6}$/.test(hex)) return null;
	const r = parseInt(hex.slice(1, 3), 16) / 255;
	const g = parseInt(hex.slice(3, 5), 16) / 255;
	const b = parseInt(hex.slice(5, 7), 16) / 255;
	const lin = c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	const rLin = lin(r), gLin = lin(g), bLin = lin(b);
	const l = 0.4122214708 * rLin + 0.5363325363 * gLin + 0.0514459929 * bLin;
	const m = 0.2119034982 * rLin + 0.6806995451 * gLin + 0.1073969566 * bLin;
	const s = 0.0883024619 * rLin + 0.2817188376 * gLin + 0.6299787005 * bLin;
	const l_ = Math.cbrt(l);
	const m_ = Math.cbrt(m);
	const s_ = Math.cbrt(s);
	const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
	const b_ = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;
	let h = Math.atan2(b_, a) * (180 / Math.PI);
	return h < 0 ? h + 360 : h;
}

function updatePreview() {
	badgeHue = hexToOklchHue(badgeHueInput.value) || defaultValue.badgeHue;
	iconStyle = iconStyleInput.value || defaultValue.iconStyle;
	iconNumber = (
		iconNumberInput.value > 0 && iconNumberInput.value < 100
			? iconNumberInput.value
			: defaultValue.iconNumber
		) || iconNumberInput.value;
	iconHue = hexToOklchHue(iconHueInput.value) || defaultValue.iconHue;
	textTop = (textTopInput.value || defaultValue.textTop).toUpperCase();
	textBottom = textBottomInput.value || defaultValue.textBottom;
	if (!svgTemplate) return;
	const values = {
		image,
		badgeHue,
		iconStyle,
		iconNumber,
		iconHue,
		textTop,
		textBottom,
	};
	const svg = parseSVG(svgTemplate, values);
	const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
	const url = URL.createObjectURL(svgBlob);
	const img = new Image();
	img.onload = () => {
		const imgName = imageInput.value.split('\\').pop();
		console.info({fileName: imgName});
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
		URL.revokeObjectURL(url);
	};
	img.src = url;
}

function parseSVG(template, values) {
	return template.replace(
		/\{\{\s*([a-z]+([A-Z][a-z]*)*)\s*\}\}/g,
		(_, key) => values[key.trim()] || ''
	);
}

function setDefaultValues(event) {
	iconNumberInput.value = defaultValue.iconNumber;
	textTopInput.setAttribute('placeholder', defaultValue.textTop);
	textBottomInput.setAttribute('placeholder', defaultValue.textBottom);
}

const dropZoneInput = document.querySelector('drop-zone');
const dropZone = new DropZone(dropZoneInput);
dropZoneInput.addEventListener('drop', event => {
	dropZone.drop(event)
		.then(file => {
			setImage(file);
		})
		.catch(error => {
			console.error(error.message);
		});
});
exportPngButton.addEventListener('click', download, false);
imageInput.addEventListener('change', () => {
	const file = imageInput.files[0];
	if (!file) return;
	setImage(file)
});
badgeHueInput.addEventListener('input', updatePreview);
iconStyleInput.addEventListener('change', updatePreview);
iconNumberInput.addEventListener('input', updatePreview);
iconHueInput.addEventListener('input', updatePreview);
textTopInput.addEventListener('input', updatePreview);
textBottomInput.addEventListener('input', updatePreview);

function setImage(file) {
	const isImage = file.type.startsWith('image/');
	dropZoneInput.querySelectorAll('.file-name-after').forEach(element => element.setAttribute('file-name', file.name));
	dropZoneInput.querySelector('progress').setAttribute('value', 0);
	if (!isImage) {
		dropZoneInput.setAttribute('status', 'wrong');
	}
	const reader = new FileReader();
	reader.onloadstart = () => {
		dropZoneInput.setAttribute('status', 'load');
	};
	reader.onprogress = event => {
		console.log(event.loaded, event.total, event.loaded / event.total);
		dropZoneInput.querySelector('progress').setAttribute('value', event.loaded / event.total);
	};
	reader.onload = event => {
		dropZoneInput.setAttribute('status', 'success');
		image = event.target.result;
		updatePreview();
//		saveJsonButton.disabled = false;
		exportPngButton.disabled = false;
	};
	reader.readAsDataURL(file);
}

setDefaultValues();
loadTemplate();
/*
imageInput.addEventListener('change', () => {
	const file = imageInput.files[0];
	if (!file) return;
	const reader = new FileReader();
	reader.onload = event => {
		image = event.target.result;
		updatePreview();
//    saveJsonButton.disabled = false;
		exportPngButton.disabled = false;
	};
	reader.readAsDataURL(file);
});


file.type.startsWith('image/')
*/
