var _0xc2=["\x61\x74\x74\x61\x63\x6B","\x64\x65\x66\x65\x6E\x73\x65"];
function updateAttack() {
    const attackInput = document.getElementById('attack');
    const buffedAttackSpan = document.getElementById('buffed_attack');
    const ridaBuff = document.getElementById('rida_buff').checked;
    const turnBuff = document.getElementById('turn_buff').checked;

    let baseAttack = attackInput.value ? parseInt(attackInput.value) : 0;

    let buffedAttack = baseAttack;
    if (ridaBuff) {
        buffedAttack = Math.ceil(buffedAttack * 1.113);
    }
    if (turnBuff) {
        buffedAttack = Math.floor(buffedAttack * 1.1);
    }

    buffedAttackSpan.textContent = buffedAttack;
}

document.addEventListener('DOMContentLoaded', function() {
    var form = document.getElementById('damage-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        var formData = {};
        var inputs = form.querySelectorAll('input, select');

        const ridaBuff = document.getElementById('rida_buff').checked;
        const turnBuff = document.getElementById('turn_buff').checked;

        inputs.forEach(function(input) {
            if (input.id === 'attack' && (ridaBuff || turnBuff)) {
                const buffedAttack = document.getElementById('buffed_attack').textContent;
                formData[input.name] = buffedAttack;
            } else {
                formData[input.name] = input.value === '' ? '0' : input.value;
            }
        });

        gtag('event', 'calculate_damage', { event_category: 'engagement', event_label: 'simple' });
        fetch('/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                document.getElementById('result').innerHTML =
                    '<div style="color: red; padding: 10px;">エラー: ' + data.error + '</div>';
            } else {
                document.getElementById('result').innerHTML =
                    '<div style="color: green; padding: 10px; font-weight: bold;">' +
                    'ダメージ想定: ' + data.single_attack_damage +
                    '</div>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('result').innerHTML =
                '<div style="color: red; padding: 10px;">' +
                'エラーが発生しました: ' + error.message +
                '</div>';
        });
    });

    document.getElementById('attack').addEventListener('input', function() {
        updateAttack();
    });
});
