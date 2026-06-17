var _0xc1=["\x61\x74\x74\x61\x63\x6B","\x64\x65\x66\x65\x6E\x73\x65"];
const SLIDER_CONFIGS = {
    attack: { min: 0, max: 1500, step: 1, defaultValue: 500 },
    defense: { min: 0, max: 1500, step: 1, defaultValue: 400 },
    leader_power: { min: 0, max: 100, step: 0.5, defaultValue: 0 },
    tension: { min: 0, max: 100, step: 20, defaultValue: 0 },
    gangan: { min: 0, max: 90, step: 15, defaultValue: 0 },
    anger: { min: 0, max: 50, step: 50, defaultValue: 0 },
    force: { min: 0, max: 20, step: 20, defaultValue: 0 },
    morale: { min: 0, max: 10, step: 10, defaultValue: 0 },
    formation_buff: { min: 0, max: 10, step: 10, defaultValue: 0 },
    zone_buff: { min: 0, max: 20, step: 20, defaultValue: 0 },
    hp_buff: { min: 0, max: 100, step: 10, defaultValue: 0 },
    enhance: { min: 0, max: 60, step: 20, defaultValue: 0 },
    batsugun: { min: 0, max: 40, step: 0.5, defaultValue: 0 },
    attack_count: { min: 1, max: 10, step: 1, defaultValue: 1 },
    awaken_resist: { min: 0, max: 5, step: 5, defaultValue: 0 },
    equip_resist: { min: 0, max: 50, step: 1, defaultValue: 0 },
    panel_all_reduce: { min: 0, max: 7.5, step: 0.5, defaultValue: 0 },
    awaken_all_reduce: { min: 0, max: 5, step: 0.5, defaultValue: 0 },
    char_resist: { min: 0, max: 30, step: 5, defaultValue: 0 },
    equip_phys_resist: { min: 0, max: 70, step: 0.5, defaultValue: 0 },
    other_phys_resist: { min: 0, max: 60, step: 15, defaultValue: 0 },
    hero_reduce: { min: 0, max: 50, step: 10, defaultValue: 0 },
    barrier: { min: 0, max: 100, step: 10, defaultValue: 0 },
    protect: { min: 0, max: 20, step: 20, defaultValue: 0 },
    formation_reduce: { min: 0, max: 10, step: 10, defaultValue: 0 },
    zone_reduce: { min: 0, max: 20, step: 20, defaultValue: 0 },
    support_reduce: { min: 0, max: 100, step: 10, defaultValue: 0 },
    force_reduce: { min: 0, max: 20, step: 20, defaultValue: 0 },
    ryuou_mark: { min: 0, max: 30, step: 10, defaultValue: 0 }
};

class SliderManager {
    constructor() {
        this.incrementInterval = null;
    }

    updateSliderValue(id, value) {
        const element = document.getElementById(`${id}Value`);
        if (element) {
            const suffix = this.shouldAddPercentSuffix(id) ? '%' : '';
            element.textContent = value + suffix;
        }
    }

    shouldAddPercentSuffix(id) {
        const nonPercentageSliders = ['attack', 'defense', 'attack_count'];
        return !nonPercentageSliders.includes(id);
    }

    startIncrement(id) {
        this.incrementValue(id);
        this.incrementInterval = setInterval(() => this.incrementValue(id), 100);
    }

    stopIncrement() {
        clearInterval(this.incrementInterval);
    }

    incrementValue(id) {
        const slider = document.getElementById(id);
        if (!slider) return;
        const config = SLIDER_CONFIGS[id];
        if (!config) return;
        const currentValue = parseFloat(slider.value);
        if (currentValue < config.max) {
            const newValue = currentValue + config.step;
            slider.value = newValue;
            this.updateSliderValue(id, newValue);
        }
    }
}

class FormDataManager {
    constructor() {
        this.form = document.getElementById('damage-form');
    }

    collectFormData() {
        const formData = {};
        const inputs = this.form.querySelectorAll('input, select');
        const ridaBuff = document.getElementById('rida_buff').checked;
        const turnBuff = document.getElementById('turn_buff').checked;

        inputs.forEach(input => {
            if (input.type === 'radio') {
                if (input.checked) {
                    formData[input.name] = input.value;
                }
            } else if (input.type === 'checkbox') {
                // skip
            } else if (input.id === 'attack' && (ridaBuff || turnBuff)) {
                formData[input.name] = document.getElementById('buffed_attack').textContent;
            } else {
                formData[input.name] = input.value === '' ? '0' : input.value;
            }
        });

        return formData;
    }

    displayResult(data) {
        const resultElement = document.getElementById('result');
        if (data.error) {
            resultElement.innerHTML =
                '<div style="color: red; padding: 10px;">エラー: ' + data.error + '</div>';
        } else {
            resultElement.innerHTML =
                '<div style="color: green; padding: 5px; font-weight: bold;">' +
                '1回あたりダメージ想定: ' + data.single_attack_damage +
                '<br>最終ダメージ想定: ' + data.total_attack_damage +
                '<br><span style="color: #e65100;">会心の一撃: ' + data.total_critical_damage + '</span>' +
                '</div>';
        }
    }
}

class ApiManager {
    async calculateDamage(formData) {
        try {
            gtag('event', 'calculate_damage', { event_category: 'engagement', event_label: 'detailed' });
            const response = await fetch('/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return { error: error.message };
        }
    }
}

function updateBuffedAttack() {
    const baseAttack = parseFloat(document.getElementById('attack').value) || 0;
    let buffed = baseAttack;
    if (document.getElementById('rida_buff').checked) buffed = Math.ceil(buffed * 1.113);
    if (document.getElementById('turn_buff').checked) buffed = Math.floor(buffed * 1.1);
    document.getElementById('buffed_attack').textContent = buffed;
}

document.addEventListener('DOMContentLoaded', function() {
    const sliderManager = new SliderManager();
    const formManager = new FormDataManager();
    const apiManager = new ApiManager();

    Object.entries(SLIDER_CONFIGS).forEach(([id, config]) => {
        const slider = document.getElementById(id);
        if (slider) {
            slider.value = config.defaultValue;
            sliderManager.updateSliderValue(id, config.defaultValue);
        }
    });

    document.querySelectorAll('button[type="button"]').forEach(button => {
        const targetId = button.getAttribute('onmousedown')?.match(/'([^']+)'/)?.[1];
        if (targetId) {
            button.onmousedown = () => sliderManager.startIncrement(targetId);
            button.onmouseup = () => sliderManager.stopIncrement();
            button.onmouseleave = () => sliderManager.stopIncrement();
            button.ontouchstart = () => sliderManager.startIncrement(targetId);
            button.ontouchend = () => sliderManager.stopIncrement();
        }
    });

    document.querySelector('.calculate-button').addEventListener('click', async function(e) {
        e.preventDefault();
        const formData = formManager.collectFormData();
        const result = await apiManager.calculateDamage(formData);
        formManager.displayResult(result);
    });

    Object.keys(SLIDER_CONFIGS).forEach(id => {
        const slider = document.getElementById(id);
        if (slider) {
            slider.addEventListener('input', function() {
                sliderManager.updateSliderValue(id, this.value);
                if (id === 'attack') updateBuffedAttack();
            });
        }
    });

    document.getElementById('rida_buff').addEventListener('change', updateBuffedAttack);
    document.getElementById('turn_buff').addEventListener('change', updateBuffedAttack);
    updateBuffedAttack();
});
