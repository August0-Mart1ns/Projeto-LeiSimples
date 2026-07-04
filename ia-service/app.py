import json
import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from openai import OpenAI

load_dotenv()

app = Flask(__name__)
CORS(
    app,
    origins=[
        origin.strip()
        for origin in os.getenv("ALLOWED_ORIGINS", "*").split(",")
        if origin.strip()
    ],
)


def infer_area(text):
    text = (text or "").lower()
    if any(word in text for word in ["banco", "emprestimo", "cartao", "consignado", "seguro"]):
        return "bancario"
    if any(word in text for word in ["demit", "fgts", "rescis", "salario", "hora extra"]):
        return "trabalhista"
    if any(word in text for word in ["aluguel", "inquil", "caucao", "despejo"]):
        return "inquilino"
    if any(word in text for word in ["pensao", "guarda", "divorcio"]):
        return "familia"
    if any(word in text for word in ["idoso", "aposent", "loas", "bpc"]):
        return "idoso"
    return "consumidor"


def fallback_analysis(descricao, renda_aproximada=None, tipo="problema"):
    area = infer_area(descricao)
    defensoria = renda_aproximada in ["ate_1_salario", "1_a_3_salarios"]

    return {
        "area_direito": area,
        "area_descricao": area.capitalize(),
        "resumo_problema": (descricao or "")[:220],
        "resumo": (
            "Existem pontos contratuais que merecem revisao juridica."
            if tipo == "contrato"
            else "A situacao descrita pode envolver violacao de direitos."
        ),
        "score_abusividade": 72 if area == "bancario" else 58,
        "mensagem_acolhimento": (
            "Esta e uma orientacao inicial. Um profissional pode confirmar os detalhes e indicar a melhor estrategia."
        ),
        "direitos": [
            "Receber informacoes claras sobre cobrancas, prazos e documentos.",
            "Contestar valores, condutas ou clausulas que parecam abusivas.",
            "Buscar atendimento juridico privado ou Defensoria Publica, conforme sua renda.",
        ],
        "proximos_passos": [
            "Reunir contratos, comprovantes, conversas, protocolos e extratos.",
            "Organizar uma linha do tempo com datas, valores e pessoas envolvidas.",
            "Solicitar atendimento com advogado especialista ou Defensoria Publica.",
        ],
        "documentos_necessarios": [
            "Documento pessoal",
            "Comprovante de renda",
            "Contratos, prints, comprovantes e protocolos relacionados",
        ],
        "indicar_defensoria": defensoria,
        "confianca": 0.68,
    }


def normalize_area(value):
    text = str(value or "").lower()
    if "banc" in text:
        return "bancario"
    if "trabalh" in text or "fgts" in text or "rescis" in text:
        return "trabalhista"
    if "inquil" in text or "alug" in text or "despej" in text:
        return "inquilino"
    if "fam" in text or "pens" in text or "guarda" in text or "divorc" in text:
        return "familia"
    if "idos" in text or "aposent" in text or "loas" in text or "bpc" in text:
        return "idoso"
    return "consumidor"


def normalize_list(value, fallback):
    if isinstance(value, list):
        items = [str(item).strip() for item in value if str(item).strip()]
        return items or fallback
    if isinstance(value, str) and value.strip():
        return [value.strip()]
    return fallback


def normalize_score(value, fallback):
    if isinstance(value, (int, float)):
        return max(0, min(100, round(value)))

    text = str(value or "").lower()
    digits = "".join(char for char in text if char.isdigit())
    if digits:
        return max(0, min(100, int(digits[:3])))
    if "alto" in text:
        return 82
    if "medio" in text or "moderad" in text:
        return 60
    if "baixo" in text:
        return 35
    return fallback


def normalize_confidence(value, fallback):
    if isinstance(value, (int, float)):
        number = float(value)
        if number > 1:
            number = number / 100
        return max(0, min(1, round(number, 2)))

    text = str(value or "").lower()
    if "alta" in text or "alto" in text:
        return 0.82
    if "media" in text or "medio" in text or "moderad" in text:
        return 0.62
    if "baixa" in text or "baixo" in text:
        return 0.38
    return fallback


def normalize_bool(value, fallback=False):
    if isinstance(value, bool):
        return value
    text = str(value or "").lower()
    if any(word in text for word in ["sim", "true", "defensoria", "publica", "necess"]):
        return True
    if any(word in text for word in ["nao", "false"]):
        return False
    return fallback


def normalize_ai_result(result, descricao, renda_aproximada=None, tipo="problema"):
    fallback = fallback_analysis(descricao, renda_aproximada, tipo)
    if not isinstance(result, dict):
        return fallback

    area_source = result.get("area_direito") or result.get("area_descricao")
    area = normalize_area(area_source)
    defensoria_por_renda = fallback["indicar_defensoria"]

    return {
        "area_direito": area,
        "area_descricao": str(result.get("area_descricao") or area.capitalize())[:160],
        "resumo_problema": str(result.get("resumo_problema") or fallback["resumo_problema"])[:260],
        "resumo": str(result.get("resumo") or fallback["resumo"])[:700],
        "score_abusividade": normalize_score(result.get("score_abusividade"), fallback["score_abusividade"]),
        "mensagem_acolhimento": str(
            result.get("mensagem_acolhimento") or fallback["mensagem_acolhimento"]
        )[:700],
        "direitos": normalize_list(result.get("direitos"), fallback["direitos"]),
        "proximos_passos": normalize_list(result.get("proximos_passos"), fallback["proximos_passos"]),
        "documentos_necessarios": normalize_list(
            result.get("documentos_necessarios") or result.get("documentos"),
            fallback["documentos_necessarios"],
        ),
        "indicar_defensoria": defensoria_por_renda or normalize_bool(
            result.get("indicar_defensoria"),
            fallback["indicar_defensoria"],
        ),
        "confianca": normalize_confidence(result.get("confianca"), fallback["confianca"]),
    }


def is_openrouter_key(api_key):
    return (api_key or "").lower().startswith("sk-or-")


def get_ai_config(create_client=True):
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    provider = "openrouter" if openrouter_key or is_openrouter_key(openai_key) else "openai"
    api_key = openrouter_key or openai_key

    if not api_key:
        return None

    if provider == "openrouter":
        model = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")
        base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
        headers = {}

        referer = os.getenv("OPENROUTER_HTTP_REFERER") or os.getenv("APP_URL")
        title = os.getenv("OPENROUTER_APP_TITLE", "LeiSimples")
        if referer:
            headers["HTTP-Referer"] = referer
        if title:
            headers["X-OpenRouter-Title"] = title

        config = {
            "provider": provider,
            "model": model,
        }
        if create_client:
            config["client"] = OpenAI(
                api_key=api_key,
                base_url=base_url,
                default_headers=headers or None,
            )
        return config

    config = {
        "provider": provider,
        "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
    }
    if create_client:
        config["client"] = OpenAI(api_key=api_key)
    return config


def parse_ai_json(content):
    if not content:
        return None
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        start = content.find("{")
        end = content.rfind("}")
        if start >= 0 and end > start:
            return json.loads(content[start : end + 1])
        raise


def create_completion(client, model, messages, use_response_format=True):
    params = {
        "model": model,
        "messages": messages,
        "temperature": 0.2,
    }
    if use_response_format:
        params["response_format"] = {"type": "json_object"}

    return client.chat.completions.create(**params)


def ask_ai(descricao, renda_aproximada=None, tipo="problema"):
    config = get_ai_config(create_client=True)
    if not config:
        return None

    prompt = {
        "tipo": tipo,
        "descricao": descricao,
        "renda_aproximada": renda_aproximada,
        "instrucoes": (
            "Analise como triagem juridica brasileira inicial. "
            "Nao prometa resultado. Responda somente JSON valido com as chaves: "
            "area_direito, area_descricao, resumo_problema, resumo, score_abusividade, "
            "mensagem_acolhimento, direitos, proximos_passos, documentos_necessarios, "
            "indicar_defensoria, confianca."
        ),
    }

    messages = [
        {
            "role": "system",
            "content": "Voce e um assistente de triagem juridica brasileira para linguagem simples.",
        },
        {"role": "user", "content": json.dumps(prompt, ensure_ascii=False)},
    ]

    try:
        completion = create_completion(config["client"], config["model"], messages)
    except Exception:
        completion = create_completion(config["client"], config["model"], messages, False)

    content = completion.choices[0].message.content
    return parse_ai_json(content)


def analyze_payload(tipo):
    data = request.get_json(silent=True) or {}
    descricao = data.get("descricao", "")
    renda_aproximada = data.get("renda_aproximada")

    if len(descricao.strip()) < 10:
        return jsonify({"erro": "Descricao insuficiente."}), 400

    try:
        result = ask_ai(descricao, renda_aproximada, tipo)
    except Exception:
        result = None

    if result:
        return jsonify(normalize_ai_result(result, descricao, renda_aproximada, tipo))

    return jsonify(fallback_analysis(descricao, renda_aproximada, tipo))


@app.get("/health")
def health():
    config = get_ai_config(create_client=False)
    return jsonify({
        "status": "ok",
        "ai_configured": bool(config),
        "ai_provider": config["provider"] if config else None,
        "ai_model": config["model"] if config else None,
    })


@app.post("/analyze")
def analyze():
    return analyze_payload("problema")


@app.post("/analyze-contract")
def analyze_contract():
    return analyze_payload("contrato")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5001")))
