import { DropZone } from './modules/DropZone.js';

const imageInput = document.getElementById('imageInput');
//const jsonInput = document.getElementById('jsonInput');
const badgeHueInput = document.getElementById('badgeHueInput');
const iconStyleInput = document.getElementById('iconStyleInput');
const iconNumberInput = document.getElementById('iconNumberInput');
const iconHueInput = document.getElementById('iconHueInput');
const textTopInput = document.getElementById('textTopInput');
const textBottomInput = document.getElementById('textBottomInput');
const dropZoneInput = document.querySelector('drop-zone');
const canvas = document.querySelector('canvas');
const canvasContext = canvas.getContext('2d');
const exportCanvas = document.createElement('canvas');
const exportCanvasContext = exportCanvas.getContext('2d');
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
		updateCanvas();
	})
	.catch(error => {
		console.error(error);
	});
}

function getFileName() {
	const icon = iconStyleInput[iconStyleInput.selectedIndex].text + (
		iconStyle === 'number'
			? ` ${iconNumber}`
			: ''
	);
	const fileName = `${textTop} - ${textBottom} (${icon}).png`;
	return fileName;
}

async function getExportDataUrl(size) {
	exportCanvas.height = size;
	exportCanvas.width = size;
	await updateCanvas(exportCanvasContext);
	const dataUrl = exportCanvas.toDataURL('image/png');
	return dataUrl;
}

async function download() {
	const fileName = getFileName();
	const dataUrl = await getExportDataUrl(200);
	const link = document.createElement('a');
	link.download = fileName;
	link.href = dataUrl;
	link.click();
	link.remove();
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

function updateCanvas(settings) {
	return new Promise((resolve) => {
		const thisUpdateImage = settings?.updateImage || false;
		const thisContext = settings?.context instanceof CanvasRenderingContext2D
			? context
			: canvasContext;
		const thisCanvas = thisContext.canvas;
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
		const svgVars = {
			image,
			badgeHue,
			iconStyle,
			iconNumber,
			iconHue,
			textTop,
			textBottom,
		};
		const svg = parseSvgVars(svgTemplate, svgVars);
		const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
		const url = URL.createObjectURL(svgBlob);
		const tempImage = new Image();
		tempImage.onload = () => {
			thisContext.clearRect(0, 0, thisCanvas.width, thisCanvas.height);
			thisContext.drawImage(tempImage, 0, 0, thisCanvas.width, thisCanvas.height);
			URL.revokeObjectURL(url);
			if (thisContext === canvasContext && !canvas.dataset.visible) {
				requestAnimationFrame(() => {
					canvas.dataset.visible = true;
				});
			}
			if (thisUpdateImage && dropZone.getStatus() !== 'init') {
				dropZone.setStatus('success');
				dropZone.setStatus('select', 3000);
			}
			resolve();
		};
		tempImage.src = url;
	});
}

function parseSvgVars(template, values) {
	return template.replace(
		/\{\{\s*([a-z]+([A-Z][a-z]*)*)\s*\}\}/g,
		(_, key) => values[key.trim()] || ''
	);
}

function setDefaultValues() {
	iconNumberInput.value = defaultValue.iconNumber;
	textTopInput.setAttribute('placeholder', defaultValue.textTop);
	textBottomInput.setAttribute('placeholder', defaultValue.textBottom);
}

function checkFile(file) {
	Promise.resolve()
		.then(() => initDropZone(file))
		.then(() => checkFileType(file))
		.then(() => readFile(file))
		.catch(error => {
			console.error(error.message);
			dropZone.setStatus(error.status || 'error');
			dropZone.setStatus('select', 3000);
		});
}

function initDropZone(file) {
	dropZoneInput.querySelectorAll('.file-name-suffix').forEach(
		element => element.setAttribute('file-name', file.name)
	);
	dropZoneInput.querySelector('[type="load"] progress').value = 0;
}

function checkFileType(file) {
	if (!file.type.startsWith('image/')) {
		dropZone.setStatus('wrong');
		dropZone.setStatus('select', 3000);
		return Promise.reject({
			status: 'wrong',
			message: 'Wrong file type',
		});
	}
}

function readFile(file) {
	const reader = new FileReader();
	reader.onloadstart = () => {
		dropZone.setStatus('load');
	};
	reader.onprogress = event => {
		dropZoneInput.querySelector('[type="load"] progress').value = event.loaded / event.total;
	};
	reader.onload = event => {
		dropZone.setStatus('parse');
		image = event.target.result;
		updateCanvas({ updateImage: true });
	};
	reader.readAsDataURL(file);
}

const dropZone = new DropZone(dropZoneInput, checkFile);
imageInput.addEventListener('change', () => {
	const file = imageInput.files[0];
	if (!file) return;
	checkFile(file);
});
exportPngButton.addEventListener('click', download);
badgeHueInput.addEventListener('input', updateCanvas);
iconStyleInput.addEventListener('change', updateCanvas);
iconNumberInput.addEventListener('input', updateCanvas);
iconHueInput.addEventListener('input', updateCanvas);
textTopInput.addEventListener('input', updateCanvas);
textBottomInput.addEventListener('input', updateCanvas);

setDefaultValues();
loadTemplate();
