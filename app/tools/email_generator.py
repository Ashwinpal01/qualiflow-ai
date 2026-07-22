from app.core.llm import call_llm


def create_fallback_email(
    lead_name: str,
    company: str,
    problem: str,
    service: dict,
) -> dict:
    subject = f"{service['service_name']} for {company}"

    body = f"""Hi {lead_name},

Thank you for sharing details about your requirements.

Based on your need to address the following problem:

"{problem}"

Our {service['service_name']} appears to be a strong fit.

The solution would help by:

{service['description']}

The estimated starting price is {service['currency']} {service['starting_price']:,.0f}, with a typical delivery time of {service['delivery_time']}.

Recommended next step:

{service['next_step']}

Best regards,
AI Solutions Team
"""

    return {
        "subject": subject,
        "body": body,
        "generation_method": "template_fallback",
    }


def generate_sales_email(
    lead_name: str,
    company: str,
    problem: str,
    qualification: str | None,
    lead_score: int | None,
    recommended_action: str | None,
    service: dict,
) -> dict:
    system_prompt = """
You are a professional sales assistant for an AI development company.

Write a concise, personalized sales email.

Rules:
- Do not exaggerate.
- Do not guarantee results.
- Do not invent prices or timelines.
- Use only the supplied service information.
- Keep the email under 220 words.
- Return the response in exactly this format:

SUBJECT: email subject

BODY:
email body
"""

    user_prompt = f"""
Lead name: {lead_name}
Company: {company}
Business problem: {problem}
Qualification: {qualification}
Lead score: {lead_score}
Recommended action: {recommended_action}

Matched service:
Service name: {service["service_name"]}
Description: {service["description"]}
Currency: {service["currency"]}
Starting price: {service["starting_price"]}
Price range: {service["estimated_price_range"]["minimum"]} to {service["estimated_price_range"]["maximum"]}
Delivery time: {service["delivery_time"]}
Next step: {service["next_step"]}
"""

    try:
        response = call_llm(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        )

        subject_marker = "SUBJECT:"
        body_marker = "BODY:"

        if subject_marker in response and body_marker in response:
            subject_part, body_part = response.split(
                body_marker,
                maxsplit=1,
            )

            subject = subject_part.replace(
                subject_marker,
                "",
            ).strip()

            body = body_part.strip()

            if subject and body:
                return {
                    "subject": subject,
                    "body": body,
                    "generation_method": "llm",
                }

    except Exception:
        pass

    return create_fallback_email(
        lead_name=lead_name,
        company=company,
        problem=problem,
        service=service,
    )