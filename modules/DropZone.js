'use strict';

export class DropZone {
	callback;
	dragOver;
	dropZone;
	statusTimer;

	constructor(dropZone, callback) {
		this.callback = callback;
		this.dropZone = dropZone;
		this.dropZone.addEventListener('dragenter', this.dragEnter.bind(this));
		this.dropZone.addEventListener('dragleave', this.dragLeave.bind(this));
		this.dropZone.addEventListener('dragover', this.dragEnter.bind(this));
		this.dropZone.addEventListener('drop', this.drop.bind(this));
	}

	dragEnter(event) {
		event.preventDefault();
		this.setDragOver(true);
	}

	dragLeave(event) {
		event.preventDefault();
		this.setDragOver(false);
	}

	drop(event) {
		event.preventDefault();
		this.setDragOver(false);
		let file = null;
		const items = event.dataTransfer?.items;
		if (items) {
			for (const item of items) {
				if (item.kind === 'file') {
					file = item.getAsFile();
					break;
				}
			}
		}
		else if (event.dataTransfer.files.length > 0) {
			file = event.dataTransfer.files[0];
		}
		if (file) {
			if (typeof this.callback === 'function') {
				this.callback(file);
			}
			else {
				console.error('Provided callback is not a function');
			}
		}
		else {
			console.error('No file found');
		}
	}

	getStatus(status, ms) {
		return this.dropZone.getAttribute('status');
	}

	setDragOver(value) {
		if (this.dragOver === value) return;
		this.dragOver = value;
		this.dropZone.setAttribute('drag-over', this.dragOver);
	}

	setStatus(status, ms) {
		clearTimeout(this.statusTimer);
		if (ms) {
			this.statusTimer = setTimeout(() => this.setStatus('select'), 3000);
			return;
		}
		this.dropZone.setAttribute('status', status);
	}
}
