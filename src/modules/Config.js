'use strict';

export class Config {
	container;
	parameter = 'config';

	constructor(container = document) {
		this.container = container;
	}

	fromUrl() {
		if (!location.search) return;
		const url = new URL(location);
		const json = url.searchParams.get(this.parameter);
		if (!json) return;

			const config = JSON.parse(json);
			url.searchParams.delete(this.parameter);
			history.replaceState(null, '', url);
			this.#parse(config);

	}

	#disableFormElements(container, disable = true) {
		container?.querySelectorAll(':where(button, input, select)').forEach(
			(element) => element.disabled = disable
		);
	}

	#parse(config) {
		for (const name in config) {
			if ((!/^[a-z]+$/.test(name))) continue;
			const item = this.container.querySelector(`[data-config=${name}]`);
			if (!item) continue;
			let hidden = false;
			for (const setting in config[name]) {
				const boolean = config[name][setting]
					? true
					: false;
				switch (setting) {
					case 'h':
					case 'hide':
						item.dataset.hidden = boolean;
						this.#disableFormElements(item, boolean);
						hidden = true;
						break;
					case 'l':
					case 'lock':
						if (hidden) continue;
						this.#disableFormElements(item, boolean);
						break;
					case 'v':
					case 'value':
						item.querySelector(':where(input, select)').value = config[name][setting];
						break;
				}
			}
		}
	}
}
