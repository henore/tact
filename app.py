from flask import Flask, render_template, request, jsonify
import math

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/simple')
def simple():
    return render_template('index2.html')

@app.route('/other')
def other_page():
    return render_template('other.html')

@app.route('/ver')
def show_version():
    return render_template('ver.html')

def safe_float(value, default=0.0):
    """
    安全に浮動小数点数に変換する関数
    負の値は0に制限される
    """
    if value is None or str(value).strip() == '':
        return default
    try:
        return max(0, float(value))
    except ValueError:
        return default

def get_element_multiplier(element_type):
    """
    属性相性による倍率を返す関数
    """
    multipliers = {
        "大弱点(150%)": 1.50,
        "弱点(125%)": 1.25,
        "等倍(100%)": 1.00,
        "軽減(75%)": 0.75,
        "半減(50%)": 0.50,
        "激減(25%)": 0.25
    }
    return multipliers.get(element_type, 1.0)

def calculate_base_damage(attack, defense):
    """
    基本ダメージの計算
    - 攻撃力÷2は小数点保持
    - 防御力÷4は小数点保持
    """
    attack_calc = attack/2
    defense_calc = defense/4
    base = attack_calc - defense_calc
    return max(0, base)

@app.route('/calculate', methods=['POST'])
def calculate():
   try:
       data = request.get_json()
       if not data:
           return jsonify({'error': 'データが受信できませんでした'}), 400

       process = []

       # 1. 基本ダメージ計算（小数点保持）
       attack = safe_float(data.get("attack"))
       defense = safe_float(data.get("defense"))
       damage = calculate_base_damage(attack, defense)
       process.append(f"基本ダメージ: {damage:.4f}")

       # 2. 特技倍率（小数点保持）
       skill_mult = safe_float(data.get("skill_mult"))
       if skill_mult:
           damage = damage * (skill_mult/100)
           process.append(f"特技倍率適用後: {damage:.4f}")

       # 3. 威力アップ（小数点保持）
       power_ups = [
           safe_float(data.get("leader_power")),
           safe_float(data.get("potential_power")),
           safe_float(data.get("equipment_power")),
           safe_float(data.get("awaken_power")),
           safe_float(data.get("panel_power")),
           safe_float(data.get("rank_power")),
           safe_float(data.get("other_power"))
       ]
       if any(power_ups):
           power_total = sum(power_ups)
           damage = damage * (1 + power_total/100)
           process.append(f"威力アップ適用後: {damage:.4f}")

       # 4. バフ系（小数点保持）
       buff_keys = ["tension", "anger", "morale", "formation_buff",
                   "gangan", "force", "zone_buff", "hp_buff",
                   "other_buff1", "other_buff2","damage_up","enhance"]
       buff_coefficient = 1.0
       for key in buff_keys:
           buff_value = safe_float(data.get(key))
           if buff_value:
               buff_coefficient *= (1 + buff_value/100)
       damage = damage * buff_coefficient
       process.append(f"バフ適用後: {damage:.4f}")

       # 5. ばつぐん効果（小数点保持）
       batsugun = safe_float(data.get("batsugun"))
       if batsugun:
           damage = damage * (1 + batsugun/100)
           process.append(f"ばつぐん効果適用後: {damage:.4f}")

       # 6. 属性相性（小数点保持）
       element_type = data.get("element_type")
       base_mult = get_element_multiplier(element_type)
       awaken_resist = safe_float(data.get("awaken_resist")) / 100
       equip_resist = safe_float(data.get("equip_resist")) / 100
       actual_mult = base_mult - (awaken_resist + equip_resist)
       damage = damage * actual_mult
       process.append(f"属性補正適用後: {damage:.4f}")

       # 7. 物理耐性（小数点保持）
       resist_total = 0.0
       resist_keys = ["char_resist", "equip_phys_resist", "equip_element_resist",
                     "awaken_phys_resist", "other_phys_resist"]
       for key in resist_keys:
           resist_value = safe_float(data.get(key))
           resist_total += resist_value
       if resist_total > 0:
           damage = damage * (1 - resist_total/100)
           process.append(f"物理耐性適用後: {damage:.4f}")

       # 8. パネル軽減
       panel_reduce = safe_float(data.get("panel_all_reduce"))
       if panel_reduce == 5:
                       #5%は個別軽減
            damage = damage * 0.995 #0.5%の軽減
            damage = damage * 0.99 #1%の軽減
            damage = damage * 0.985 #1.5%の軽減
            damage = damage * 0.98 #2%の軽減
            process.append(f"パネル軽減適用後: {damage:.4f}")

       if panel_reduce == 7.5:
                       #7.5%ロト拡張対応
            damage = damage * 0.995 #0.5%の軽減
            damage = damage * 0.99 #1%の軽減
            damage = damage * 0.985 #1.5%の軽減
            damage = damage * 0.98 #2%の軽減
            damage = damage * 0.975 #2.5%の軽減
            process.append(f"パネル軽減適用後: {damage:.4f}")

       if panel_reduce <= 4.5:
            damage = damage * (1 - panel_reduce/100)
            process.append(f"パネル軽減適用後: {damage:.4f}")

            #開花軽減
       awaken_all_reduce = safe_float(data.get("awaken_all_reduce"))
       if awaken_all_reduce:
            damage = damage * (1 - awaken_all_reduce/100)
            process.append(f"開花軽減適用後: {damage:.4f}")

       # 9. 軽減系（切り捨て）
       reduction_coefficient = 1.0
       reduction_keys = ["hero_reduce", "barrier", "protect", "formation_reduce",
                        "zone_reduce", "support_reduce", "other_reduce1",
                        "other_reduce2", "arena_reduce"]
       for key in reduction_keys:
           reduction = safe_float(data.get(key))
           if reduction:
               reduction_coefficient *= (1 - reduction/100)
       damage =  damage * reduction_coefficient
       damage = math.floor( damage )
       process.append(f"軽減適用後: {damage}")

        # 攻撃回数の適用
       attack_count = safe_float(data.get("attack_count", 1))
       if attack_count > 1:
            total_attack_damage = damage * attack_count
            process.append(f"攻撃回数 {attack_count} 回適用後: {total_attack_damage}")

            result = {
                'single_attack_damage': damage,
                'total_attack_damage': total_attack_damage
            }
       else:
            result = {
                'single_attack_damage': damage,
                'total_attack_damage': damage
            }

       return jsonify(result)

   except Exception as e:
       return jsonify({'error': f'計算エラー: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True)