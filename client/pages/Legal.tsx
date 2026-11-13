import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ShieldCheck, FileText, ArrowLeft } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

/**
 * Terms of Use / Privacy Policy.
 *
 * The login and signup screens link to these documents. This page states only
 * facts that are verifiable in the platform itself (what is collected, where it
 * is stored, how it is isolated). It does not invent binding legal clauses:
 * the formal, legally reviewed text is marked as pending. Replace the `pending`
 * notices with counsel-approved copy before a public launch.
 */

type Doc = "terms" | "privacy";

interface Copy {
  title: string;
  intro: string;
  pending: string;
  back: string;
  sections: { heading: string; body: string[] }[];
}

const COPY: Record<"ar" | "fr" | "en", Record<Doc, Copy>> = {
  ar: {
    terms: {
      title: "شروط الاستخدام",
      intro:
        "توضّح هذه الصفحة كيف يعمل استخدام منصة AgroGrowth. النص القانوني النهائي المراجَع من مستشار قانوني لم يُعتمد بعد، ويجب استبدال هذا الإشعار به قبل الإطلاق العام.",
      pending: "النص القانوني النهائي قيد المراجعة القانونية.",
      back: "رجوع",
      sections: [
        {
          heading: "الحساب والمسؤولية",
          body: [
            "تنشئ حسابًا ببريد إلكتروني وكلمة مرور عبر مزوّد المصادقة (Supabase Auth). أنت مسؤول عن سرّية بيانات الدخول وعن صحة البيانات التي تُدخلها.",
            "الصلاحية (فلاح، خبير زراعي، طبيب بيطري، مدير نظام…) تُحدَّد من طرف الخادم وليس من المتصفح، ولا يمكن للمستخدم العادي منح نفسه صلاحية مدير.",
          ],
        },
        {
          heading: "طبيعة المعلومات الزراعية",
          body: [
            "توصيات المحاصيل والري والآفات ومكافحتها تُبنى على قواعد حتمية أو نماذج مدرّبة موصوفة بصدق داخل التطبيق، وليست بديلاً عن استشارة مهندس زراعي ميداني.",
            "كل نتيجة تُرافقها بيانات المصدر (dataSource / isRealData) لتفرّق بين بيانات حقيقية وقواعد حتمية ونماذج تجريبية.",
          ],
        },
        {
          heading: "الاستخدام المقبول",
          body: [
            "يُمنع استخدام المنصة لإدخال بيانات غير صحيحة بغرض التضليل، أو محاولة الوصول إلى بيانات مستخدم آخر، أو إساءة استخدام واجهات الخدمة.",
          ],
        },
      ],
    },
    privacy: {
      title: "سياسة الخصوصية",
      intro:
        "تصف هذه الصفحة البيانات التي تجمعها المنصة فعلياً وأين تُخزَّن وكيف تُعزل. النص القانوني النهائي المراجَع لم يُعتمد بعد.",
      pending: "النص القانوني النهائي قيد المراجعة القانونية.",
      back: "رجوع",
      sections: [
        {
          heading: "ما الذي نجمعه",
          body: [
            "بيانات الحساب: البريد الإلكتروني (تُديره خدمة المصادقة Supabase Auth) والاسم والدور ومعلومات الملف الشخصي التي تُدخلها.",
            "بيانات النشاط الزراعي التي تُسجّلها: الضيعات، القطع، المحاصيل، الأنشطة، تحاليل التربة، المواشي، المالية.",
            "لا نطلب ولا نخزّن بيانات بطاقات الدفع في هذه النسخة.",
          ],
        },
        {
          heading: "أين تُخزَّن وكيف تُعزل",
          body: [
            "تُخزَّن البيانات في قاعدة بيانات Postgres مُدارة (Supabase).",
            "أمان مستوى الصفوف (RLS) مُفعَّل على الجداول، بحيث لا يطّلع مستخدم على سجلات مستخدم آخر. عمليات الإدارة الحسّاسة محميّة وتُسجَّل في سجل تدقيق.",
          ],
        },
        {
          heading: "حقوقك",
          body: [
            "يمكنك تحديث بياناتك من الإعدادات، وحذف حسابك. حذف الحساب يزيل ملفك الشخصي وبياناته المرتبطة وفق قواعد الحذف المتسلسل المُعرَّفة في قاعدة البيانات.",
          ],
        },
      ],
    },
  },
  fr: {
    terms: {
      title: "Conditions d'utilisation",
      intro:
        "Cette page décrit le fonctionnement d'AgroGrowth. Le texte juridique définitif, validé par un conseil, n'est pas encore adopté et doit remplacer cet avis avant un lancement public.",
      pending: "Texte juridique définitif en cours de validation.",
      back: "Retour",
      sections: [
        {
          heading: "Compte et responsabilité",
          body: [
            "Vous créez un compte avec un e-mail et un mot de passe via le fournisseur d'authentification (Supabase Auth). Vous êtes responsable de la confidentialité de vos identifiants et de l'exactitude des données saisies.",
            "Le rôle (agriculteur, agronome, vétérinaire, administrateur…) est déterminé côté serveur, jamais par le navigateur ; un utilisateur ordinaire ne peut pas s'attribuer le rôle d'administrateur.",
          ],
        },
        {
          heading: "Nature des informations agricoles",
          body: [
            "Les recommandations (cultures, irrigation, ravageurs) reposent sur des règles déterministes ou des modèles entraînés décrits honnêtement dans l'application ; elles ne remplacent pas l'avis d'un ingénieur agronome sur le terrain.",
            "Chaque résultat est accompagné de sa provenance (dataSource / isRealData) afin de distinguer données réelles, règles déterministes et modèles de démonstration.",
          ],
        },
        {
          heading: "Usage acceptable",
          body: [
            "Il est interdit de saisir des données fausses pour induire en erreur, de tenter d'accéder aux données d'un autre utilisateur ou d'abuser des interfaces de service.",
          ],
        },
      ],
    },
    privacy: {
      title: "Politique de confidentialité",
      intro:
        "Cette page décrit les données réellement collectées, où elles sont stockées et comment elles sont isolées. Le texte juridique définitif n'est pas encore adopté.",
      pending: "Texte juridique définitif en cours de validation.",
      back: "Retour",
      sections: [
        {
          heading: "Ce que nous collectons",
          body: [
            "Données de compte : e-mail (géré par Supabase Auth), nom, rôle et informations de profil que vous saisissez.",
            "Données d'activité agricole que vous enregistrez : exploitations, parcelles, cultures, activités, analyses de sol, cheptel, finances.",
            "Aucune donnée de carte bancaire n'est demandée ni stockée dans cette version.",
          ],
        },
        {
          heading: "Où et comment",
          body: [
            "Les données sont stockées dans une base Postgres managée (Supabase).",
            "La sécurité au niveau des lignes (RLS) est activée : un utilisateur ne voit pas les enregistrements d'un autre. Les opérations d'administration sensibles sont protégées et journalisées.",
          ],
        },
        {
          heading: "Vos droits",
          body: [
            "Vous pouvez mettre à jour vos données depuis les paramètres et supprimer votre compte. La suppression retire votre profil et ses données liées selon les règles de cascade définies dans la base.",
          ],
        },
      ],
    },
  },
  en: {
    terms: {
      title: "Terms of Use",
      intro:
        "This page explains how using the AgroGrowth platform works. The final, counsel-reviewed legal text is not yet adopted and must replace this notice before a public launch.",
      pending: "Final legal text is pending legal review.",
      back: "Back",
      sections: [
        {
          heading: "Account and responsibility",
          body: [
            "You create an account with an email and password via the authentication provider (Supabase Auth). You are responsible for keeping your credentials secret and for the accuracy of the data you enter.",
            "Your role (farmer, agronomist, veterinarian, administrator…) is determined server-side, never by the browser; an ordinary user cannot grant themselves an administrator role.",
          ],
        },
        {
          heading: "Nature of the agricultural information",
          body: [
            "Recommendations (crops, irrigation, pests) are built on deterministic rules or trained models that the application describes honestly; they are not a substitute for a field agronomist's advice.",
            "Every result carries its provenance (dataSource / isRealData) so real data, deterministic rules and demo models are distinguishable.",
          ],
        },
        {
          heading: "Acceptable use",
          body: [
            "You must not enter false data to mislead, attempt to access another user's data, or abuse the service interfaces.",
          ],
        },
      ],
    },
    privacy: {
      title: "Privacy Policy",
      intro:
        "This page describes the data the platform actually collects, where it is stored and how it is isolated. The final legal text is not yet adopted.",
      pending: "Final legal text is pending legal review.",
      back: "Back",
      sections: [
        {
          heading: "What we collect",
          body: [
            "Account data: email (managed by Supabase Auth), name, role and the profile information you enter.",
            "Agricultural activity data you record: farms, fields, crops, activities, soil analyses, livestock, finance.",
            "No payment-card data is requested or stored in this version.",
          ],
        },
        {
          heading: "Where and how",
          body: [
            "Data is stored in a managed Postgres database (Supabase).",
            "Row Level Security (RLS) is enabled: one user cannot see another user's records. Sensitive administrative operations are protected and audited.",
          ],
        },
        {
          heading: "Your rights",
          body: [
            "You can update your data from settings and delete your account. Deletion removes your profile and its related data per the cascade rules defined in the database.",
          ],
        },
      ],
    },
  },
};

export default function Legal() {
  const { language, dir } = useLanguage();
  const { pathname } = useLocation();
  const doc: Doc = pathname.startsWith("/privacy") ? "privacy" : "terms";
  const copy = COPY[language]?.[doc] ?? COPY.ar[doc];
  const Icon = doc === "privacy" ? ShieldCheck : FileText;

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6" dir={dir}>
      <Link
        to="/login"
        className="inline-flex items-center gap-2 text-sm text-emerald-700 hover:underline"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
        {copy.back}
      </Link>

      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Icon className="h-6 w-6 text-emerald-600" aria-hidden />
          <h1 className="text-2xl font-bold">{copy.title}</h1>
        </div>
        <p className="text-sm text-muted-foreground">{copy.intro}</p>
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {copy.pending}
        </p>
      </header>

      <div className="space-y-6">
        {copy.sections.map((section) => (
          <section key={section.heading} className="space-y-2">
            <h2 className="text-lg font-semibold">{section.heading}</h2>
            {section.body.map((paragraph, i) => (
              <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
