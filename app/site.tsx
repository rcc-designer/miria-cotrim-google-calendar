"use client";

import {
  type FormEvent,
  type MouseEvent,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Menu,
  MessageCircle,
  Plus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import {
  categories,
  pageTitles,
  photo,
  portfolio,
  siteContent as C,
} from "./siteContent";

type FormStatus = "idle" | "loading" | "success" | "error";
type FieldType = "text" | "email" | "tel" | "date" | "time" | "number";
type SubmitFeedback = {
  title: string;
  message: string;
};
type SubmitResponse = SubmitFeedback & {
  ok?: boolean;
  error?: string;
};
type LegalDocument = {
  title: string;
  updated: string;
  intro: string;
  sections: Array<{
    heading: string;
    body: string[];
  }>;
};
type BookingService = {
  slug: string;
  name: string;
  description: string;
  duration_minutes: number;
  buffer_after_minutes: number;
  location_type: string;
};
type AvailabilitySlot = {
  id: string;
  date: string;
  start_iso: string;
  end_iso: string;
  start_label: string;
  end_label: string;
  time_zone: string;
};

const label = {
  name: "Name",
  email: "Email",
  phone: "Phone / WhatsApp",
  message: "Message",
  eventDate: "Event date",
  eventLocation: "Event location",
  serviceType: "Service type",
  details: "Details",
  preferredDate: "Preferred date",
  preferredTime: "Preferred time",
  notes: "Notes",
};

const feedbackCopy = {
  contact: {
    loading: {
      title: "Sending your message...",
      message: "Please keep this page open while we submit your request.",
    },
    success: {
      title: "Message received.",
      message:
        "Thank you for reaching out. Miriã's team will review your message and follow up soon.",
    },
    errorTitle: "Message not sent.",
  },
  newsletter: {
    loading: {
      title: "Joining the Beauty List...",
      message: "Please wait while we save your subscription.",
    },
    success: {
      title: "You're on the Beauty List.",
      message:
        "Thank you for joining. You'll receive occasional beauty notes, bridal updates and appointment availability.",
    },
    errorTitle: "Subscription not saved.",
  },
  bridal: {
    loading: {
      title: "Sending your bridal inquiry...",
      message: "Please keep this page open while we save your event details.",
    },
    success: {
      title: "Bridal inquiry received.",
      message:
        "Thank you. Your event details were saved and Miriã's team will review them before following up.",
    },
    errorTitle: "Bridal inquiry not sent.",
  },
  booking: {
    loading: {
      title: "Sending your appointment request...",
      message:
        "Please wait while we confirm the time is still available and save your request.",
    },
    success: {
      title: "Appointment request received.",
      message:
        "Your selected time was saved as pending confirmation. Miriã's team will review it and follow up soon.",
    },
    errorTitle: "Appointment request not sent.",
  },
};

type Language = "EN" | "PT";

const i18n = {
  EN: {
    language: "EN",
    content: C,
    pageTitles: {
      ...pageTitles,
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      cancellation: "Cancellation Policy",
    },
    labels: label,
    feedback: feedbackCopy,
    categories,
    categoryLabels: Object.fromEntries(categories.map((category) => [category, category])),
    portfolioLabels: {
      Updos: "Updos",
      Brides: "Brides",
      "Natural & Curly Hair": "Natural & Curly Hair",
      "Waves & Curls": "Waves & Curls",
      "Half-Up Styles": "Half-Up Styles",
      Ponytails: "Ponytails",
    },
    ui: {
      languageNotice: "Language changed to English.",
      validationTitle: "Please review the form.",
      completeFields: "Please complete",
      invalidEmail: "Please enter a valid email address.",
      invalidPhone:
        "Please enter a valid phone or WhatsApp number with area code.",
      navBook: "Book now",
      openMenu: "Open menu",
      bookNow: "Book now",
      gotIt: "Got it",
      sending: "Sending...",
      sendMessage: "Send message",
      joining: "Joining...",
      joinBeautyList: "Join our beauty list",
      newsletterTitle: "Join our Beauty List",
      newsletterNote:
        "Occasional beauty notes, bridal updates and appointment availability.",
      brideName: "Bride name",
      selectService: "Select a service",
      requestBridalProposal: "Request bridal proposal",
      startAnotherRequest: "Start another appointment request",
      bookingEyebrow: "A MOMENT, JUST FOR YOU",
      bookingTitle: (
        <>
          Let's create
          <br />
          <em>something beautiful.</em>
        </>
      ),
      bookingIntro:
        "Choose a service and the website checks Miriã's live calendar before sending a pending appointment for confirmation.",
      bookingSteps: [
        "Select your service",
        "Choose a date",
        "Choose your time",
        "A little about you",
      ],
      step: "STEP",
      loadingServices: "Loading services...",
      detailsConfirmed: "details confirmed after request",
      inPerson: "in-person",
      estimatedAt: "is estimated at",
      filteredByLength: "Available times are filtered by service length.",
      checkingAvailability: "Checking available times...",
      availableTimesFor: "Available times for",
      noAvailableTimes:
        "No available times for this date. Please go back and choose another day.",
      until: "until",
      viewLook: "View",
      hairArtistry: "Hair artistry by Miriã Cotrim",
      previousPhoto: "Previous photo",
      nextPhoto: "Next photo",
      previous: "Previous",
      next: "Next",
      playFilm: "Play film",
      pauseFilm: "Pause film",
      filmLabel: "Bridal and celebration inspiration film",
      filmCredit: "Inspiration film · Licensed footage",
      filmNotice:
        "The homepage film uses licensed inspiration footage from Pexels. The people shown are not presented as Miriã's clients.",
      artistCaption: "THE ARTIST BEHIND YOUR BEAUTY",
      aboutEyebrow: "PERSONAL BEAUTY. PURPOSEFUL ARTISTRY.",
      aboutDetail: (
        <>
          An eye for detail.
          <br />A heart for your story.
        </>
      ),
      roles: (
        <>
          Bridal Beauty Artist · Hair Specialist
          <br />
          Makeup Artist · Event Beauty
        </>
      ),
      discoverStory: "Discover her story",
      letsMeet: "Let's meet",
      bridalPhotoCaption: "YOUR DAY. YOUR BEAUTY. YOUR MOMENT.",
      bridalEyebrow: "BEAUTIFUL FROM THE FIRST MOMENT",
      bridalTitle: (
        <>
          The bridal
          <br />
          <em>experience.</em>
        </>
      ),
      bridalText:
        "From the first conversation to the final finishing touch. Hair and makeup that reflect who you are, for a day that is entirely yours.",
      requestConsultation: "Request your bridal consultation",
      introEyebrow: "A PERSONAL APPROACH TO BEAUTY",
      servicesEyebrow: "BEAUTY, IN EVERY CHAPTER",
      servicesTitle: (
        <>
          Created around <em>you.</em>
        </>
      ),
      exploreServices: "Explore services",
      selectedWork: "SELECTED WORK",
      viewPortfolio: "View the portfolio",
      signatureEyebrow: "THE DETAILS MAKE THE DIFFERENCE",
      signatureLooks: [
        "Romantic Updo",
        "Hollywood Waves",
        "Modern Bridal Bun",
        "Soft Half-Up",
      ],
      guideEyebrow: "START WITH A CONVERSATION",
      guideTitle: "Plan your beauty experience.",
      guideText:
        "Tell us about your wedding, celebration or appointment and Miriã's team will follow up with the next step.",
      clientLoveEyebrow: "WORDS TO REMEMBER",
      awaitingStories: "Awaiting approved client stories",
      followBeauty: "Follow the beauty.",
      pageEyebrow: "MIRIÃ COTRIM · BRIDAL BEAUTY",
      careBehind: "THE CARE BEHIND EVERY LOOK",
      behindSteps: [
        "Consultation",
        "Preparation",
        "Styling",
        "Finishing touches",
        "Final look",
      ],
      specialEvents: "Special events",
      specialEventsText:
        "Personalized hair and makeup for birthdays, celebrations, photoshoots and the moments worth remembering.",
      planEventLook: "Plan your event look",
      hairTitle: "Hair, thoughtfully cared for.",
      hairText:
        "Explore cuts, styling, treatments and transformations in a personal consultation.",
      exploreAppointment: "Explore an appointment",
      bridalFormEyebrow: "TELL US ABOUT YOUR DAY",
      bridalFormTitle: (
        <>
          Plan your bridal
          <br />
          <em>beauty experience.</em>
        </>
      ),
      contactTitle: (
        <>
          Your story starts
          <br />
          <em>with a conversation.</em>
        </>
      ),
      contactText:
        "Bridal beauty, a special occasion, a fresh look or a custom event request. Send a message and Miriã's team will respond.",
      exploreAppointments: "Explore appointments",
      footerTagline: "BRIDAL BEAUTY",
      footerCopy: (
        <>
          Personal beauty.
          <br />
          Unforgettable moments.
        </>
      ),
      explore: "EXPLORE",
      letsConnect: "LET'S CONNECT",
      contact: "Contact",
      email: "Email",
      footerPolicies: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
        { label: "Cancellation Policy", href: "/cancellation" },
      ],
      policyNotice:
        "Final policies should be reviewed and published before launch.",
      whatsappMissing:
        "Add Miriã's official WhatsApp number in app/siteContent.ts before launch.",
      whatsappText:
        "Hello%20Miria%2C%20I%20would%20like%20to%20know%20more%20about%20your%20services.",
      whatsappLabel: "Talk to Miriã on WhatsApp",
      whatsappButton: "Talk to Miriã",
    },
    legal: {
      privacy: {
        title: "Privacy Policy",
        updated: "Last updated: October 2026",
        intro:
          "This Privacy Policy explains how Miriã Cotrim Bridal Beauty may collect, use and protect information submitted through this website. It is a general template and should be reviewed by a qualified professional before final publication.",
        sections: [
          {
            heading: "Information we collect",
            body: [
              "We may collect information you voluntarily submit through contact, bridal inquiry, booking and newsletter forms, including your name, email address, phone or WhatsApp number, event details, requested service, preferred date and message.",
              "The website may also collect limited technical information such as browser, device and usage data through standard hosting, analytics or security tools.",
            ],
          },
          {
            heading: "How we use your information",
            body: [
              "We use submitted information to respond to inquiries, review appointment availability, prepare bridal or beauty service proposals, manage pending booking requests and send occasional updates when you opt in.",
              "We do not sell personal information. Information may be shared only with service providers that help operate the website, store form submissions, manage calendars or send notifications.",
            ],
          },
          {
            heading: "Bookings and calendar information",
            body: [
              "When you request an appointment, the website may save the request in a secure database and create a pending calendar entry for internal review. A submitted request is not a confirmed appointment until the team confirms it.",
            ],
          },
          {
            heading: "Data storage and security",
            body: [
              "Form submissions may be stored in systems such as Supabase and processed through tools used to operate the website. Reasonable safeguards are used to protect this information, but no online system can be guaranteed to be completely secure.",
            ],
          },
          {
            heading: "Your choices",
            body: [
              "You may request correction or deletion of your submitted information, or ask to stop receiving optional marketing messages, by contacting the business through the contact options listed on the website.",
            ],
          },
        ],
      },
      terms: {
        title: "Terms of Service",
        updated: "Last updated: October 2026",
        intro:
          "These Terms describe the general conditions for using this website and requesting beauty, bridal, hair and makeup services from Miriã Cotrim Bridal Beauty. They are provided as a customizable template and should be reviewed before final publication.",
        sections: [
          {
            heading: "Website use",
            body: [
              "This website provides information about beauty services, bridal services, portfolio examples, contact options and appointment request tools. By using the website, you agree to use it only for lawful and appropriate purposes.",
            ],
          },
          {
            heading: "Service information",
            body: [
              "Service descriptions, durations, availability and pricing may change and are provided for general information. Final service details, timing, location, team availability and any travel requirements should be confirmed directly with the business.",
            ],
          },
          {
            heading: "Appointment requests",
            body: [
              "Submitting a booking form does not guarantee an appointment. Requests are reviewed and remain pending until confirmed by the owner or team. The website may show available times based on calendar information, but final confirmation is required.",
            ],
          },
          {
            heading: "Client responsibilities",
            body: [
              "Clients are responsible for providing accurate contact details, event information, service preferences and any relevant timing or location requirements. Incorrect or incomplete information may delay confirmation.",
            ],
          },
          {
            heading: "Portfolio and content",
            body: [
              "Images, videos, copy, branding and portfolio materials on this website are provided for presentation purposes and may not be copied or reused without permission.",
            ],
          },
        ],
      },
      cancellation: {
        title: "Cancellation Policy",
        updated: "Last updated: October 2026",
        intro:
          "This Cancellation Policy provides a general structure for beauty, bridal, hair and makeup appointments. It should be customized with the business's final deposit, timing and refund rules before launch.",
        sections: [
          {
            heading: "Pending requests",
            body: [
              "A request submitted through the website is not confirmed until the business approves it. Pending requests may be declined or adjusted if the requested date, time, location or service is unavailable.",
            ],
          },
          {
            heading: "Confirmed appointments",
            body: [
              "Once an appointment is confirmed, clients should notify the business as soon as possible if they need to reschedule or cancel. Availability for rescheduling is not guaranteed and depends on the calendar.",
            ],
          },
          {
            heading: "Deposits and retainers",
            body: [
              "If a deposit or retainer is required, the amount, due date and refundability should be confirmed in writing before the appointment or bridal booking is finalized.",
            ],
          },
          {
            heading: "Late arrivals and no-shows",
            body: [
              "Late arrival may reduce the available service time and may affect the final result. Missed appointments or no-shows may be subject to cancellation fees once the business's final policy is approved.",
            ],
          },
          {
            heading: "Bridal and event services",
            body: [
              "Bridal and event bookings may require special timing, travel planning, assistants or reserved dates. Cancellation rules for these services should be confirmed in a written agreement or proposal.",
            ],
          },
        ],
      },
    } satisfies Record<string, LegalDocument>,
  },
  PT: {
    language: "PT",
    content: {
      ...C,
      brand: {
        ...C.brand,
        tagline: "Beleza para Noivas",
      },
      professional: {
        ...C.professional,
        bio:
          "Miriã acredita que beleza deve ser pessoal, leve e inesquecível. Seu trabalho combina técnica, atenção aos detalhes e um atendimento personalizado para criar looks pensados para o estilo, a personalidade e o momento especial de cada cliente.",
      },
      navigation: [
        ["Home", "/"],
        ["Sobre", "/about"],
        ["Serviços", "/services"],
        ["Noivas", "/bridal"],
        ["Portfólio", "/portfolio"],
        ["Agendar", "/book"],
        ["Contato", "/contact"],
      ],
      services: [
        {
          ...C.services[0],
          name: "Beleza para Noivas",
          sub: "Penteado e maquiagem para um momento único na vida.",
        },
        {
          ...C.services[1],
          name: "Eventos Especiais",
          sub: "Aniversários, celebrações, ensaios e beleza para eventos marcantes.",
        },
        {
          ...C.services[2],
          name: "Serviços de Cabelo",
          sub: "Cortes, penteados, tratamentos e transformações planejados para você.",
        },
        {
          ...C.services[3],
          name: "Consultoria de Beleza",
          sub: "Uma conversa personalizada para escolher o look, o tempo e o serviço ideal.",
        },
      ],
      bridalServices: [
        "Penteado da noiva",
        "Maquiagem da noiva",
        "Prévia da noiva",
        "Madrinhas",
        "Mãe da noiva",
        "Mãe do noivo",
        "Wedding party",
        "Penteado para evento",
        "Beleza no local",
      ],
      seo: {
        title: "Miriã Cotrim | Beleza para Noivas, Cabelo e Maquiagem",
        description:
          "Penteados, maquiagem, beleza para eventos e atendimentos personalizados com Miriã Cotrim em Orlando e Miami.",
      },
      copy: {
        ...C.copy,
        eyebrow: "NOIVAS • CABELO • MAQUIAGEM",
        hero: "Beleza para os seus",
        heroEm: "momentos mais lindos",
        heroEnd: ".",
        heroSub:
          "Cabelo, maquiagem e beleza para eventos criados ao redor da sua história, do seu estilo e de como você deseja se sentir.",
        book: "Agendar atendimento",
        explore: "Conhecer serviços para noivas",
        position: "Beleza para noivas, elevada.",
        positionText:
          "Mais do que um look bonito. A sensação de estar inteiramente você. Conheça cabelo e maquiagem personalizados para noivas, madrinhas, eventos especiais e retratos inesquecíveis.",
        portfolio: "A arte de se sentir bonita.",
        about: "Conheça Miriã",
        behind: "Por trás da beleza",
        signature: "Looks assinatura",
        confirmation: "Sua solicitação foi enviada.",
        confirmationText:
          "Obrigada. A equipe de Miriã vai revisar sua mensagem e responder em breve.",
        next: "Continuar",
        back: "Voltar",
        submit: "Enviar solicitação de agendamento",
        clientLove: "Carinho das clientes",
        testimonial: "Depoimento da cliente aparecerá aqui.",
      },
    },
    pageTitles: {
      about: "Beleza com toque pessoal.",
      services: "Para cada momento especial.",
      bridal: "Seu dia. Do seu jeito.",
      portfolio: "Uma coleção de momentos bonitos.",
      contact: "Vamos criar algo lindo.",
      privacy: "Política de Privacidade",
      terms: "Termos de Serviço",
      cancellation: "Política de Cancelamento",
    },
    labels: {
      name: "Nome",
      email: "E-mail",
      phone: "Telefone / WhatsApp",
      message: "Mensagem",
      eventDate: "Data do evento",
      eventLocation: "Local do evento",
      serviceType: "Tipo de serviço",
      details: "Detalhes",
      preferredDate: "Data preferida",
      preferredTime: "Horário preferido",
      notes: "Observações",
    },
    feedback: {
      contact: {
        loading: {
          title: "Enviando sua mensagem...",
          message: "Mantenha esta página aberta enquanto enviamos sua solicitação.",
        },
        success: {
          title: "Mensagem recebida.",
          message:
            "Obrigada pelo contato. A equipe de Miriã vai revisar sua mensagem e responder em breve.",
        },
        errorTitle: "Mensagem não enviada.",
      },
      newsletter: {
        loading: {
          title: "Entrando na Beauty List...",
          message: "Aguarde enquanto salvamos sua inscrição.",
        },
        success: {
          title: "Você está na Beauty List.",
          message:
            "Obrigada por entrar na lista. Você receberá novidades, conteúdos de beleza e disponibilidade de agenda.",
        },
        errorTitle: "Inscrição não salva.",
      },
      bridal: {
        loading: {
          title: "Enviando sua consulta para noivas...",
          message: "Mantenha esta página aberta enquanto salvamos os detalhes do evento.",
        },
        success: {
          title: "Consulta para noivas recebida.",
          message:
            "Obrigada. Os detalhes do seu evento foram salvos e a equipe de Miriã vai revisar antes de responder.",
        },
        errorTitle: "Consulta para noivas não enviada.",
      },
      booking: {
        loading: {
          title: "Enviando sua solicitação de agendamento...",
          message:
            "Aguarde enquanto verificamos se o horário ainda está disponível e salvamos seu pedido.",
        },
        success: {
          title: "Solicitação de agendamento recebida.",
          message:
            "O horário escolhido foi salvo como pendente de confirmação. A equipe de Miriã vai revisar e responder em breve.",
        },
        errorTitle: "Solicitação de agendamento não enviada.",
      },
    },
    categories,
    categoryLabels: {
      All: "Todos",
      Brides: "Noivas",
      Updos: "Coques",
      "Half-Up Styles": "Semipresos",
      "Waves & Curls": "Ondas e cachos",
      Ponytails: "Rabos de cavalo",
      "Natural & Curly Hair": "Cabelos naturais e cacheados",
    },
    portfolioLabels: {
      Updos: "Coques",
      Brides: "Noivas",
      "Natural & Curly Hair": "Cabelos naturais e cacheados",
      "Waves & Curls": "Ondas e cachos",
      "Half-Up Styles": "Semipresos",
      Ponytails: "Rabos de cavalo",
    },
    ui: {
      languageNotice: "Idioma alterado para português.",
      validationTitle: "Revise o formulário.",
      completeFields: "Preencha",
      invalidEmail: "Digite um e-mail válido.",
      invalidPhone:
        "Digite um telefone ou WhatsApp válido com código de área.",
      navBook: "Agendar",
      openMenu: "Abrir menu",
      bookNow: "Agendar",
      gotIt: "Entendi",
      sending: "Enviando...",
      sendMessage: "Enviar mensagem",
      joining: "Entrando...",
      joinBeautyList: "Entrar na Beauty List",
      newsletterTitle: "Join our Beauty List",
      newsletterNote:
        "Novidades ocasionais sobre beleza, noivas e disponibilidade de agenda.",
      brideName: "Nome da noiva",
      selectService: "Selecione um serviço",
      requestBridalProposal: "Solicitar proposta para noiva",
      startAnotherRequest: "Iniciar outro pedido de agendamento",
      bookingEyebrow: "UM MOMENTO SÓ PARA VOCÊ",
      bookingTitle: (
        <>
          Vamos criar
          <br />
          <em>algo lindo.</em>
        </>
      ),
      bookingIntro:
        "Escolha um serviço e o site verifica a agenda de Miriã antes de enviar um pedido pendente de confirmação.",
      bookingSteps: [
        "Escolha o serviço",
        "Escolha a data",
        "Escolha o horário",
        "Conte um pouco sobre você",
      ],
      step: "ETAPA",
      loadingServices: "Carregando serviços...",
      detailsConfirmed: "detalhes confirmados após o pedido",
      inPerson: "presencial",
      estimatedAt: "tem duração estimada de",
      filteredByLength:
        "Os horários disponíveis são filtrados conforme a duração do serviço.",
      checkingAvailability: "Verificando horários disponíveis...",
      availableTimesFor: "Horários disponíveis para",
      noAvailableTimes:
        "Não há horários disponíveis nesta data. Volte e escolha outro dia.",
      until: "até",
      viewLook: "Ver look",
      hairArtistry: "Arte em cabelo por Miriã Cotrim",
      previousPhoto: "Foto anterior",
      nextPhoto: "Próxima foto",
      previous: "Anterior",
      next: "Próximo",
      playFilm: "Reproduzir vídeo",
      pauseFilm: "Pausar vídeo",
      filmLabel: "Vídeo de inspiração para noivas e celebrações",
      filmCredit: "Vídeo de inspiração · Imagens licenciadas",
      filmNotice:
        "O vídeo da home usa imagens licenciadas de inspiração do Pexels. As pessoas exibidas não são apresentadas como clientes de Miriã.",
      artistCaption: "A ARTISTA POR TRÁS DA SUA BELEZA",
      aboutEyebrow: "BELEZA PESSOAL. ARTE COM PROPÓSITO.",
      aboutDetail: (
        <>
          Olhar para os detalhes.
          <br />Cuidado com a sua história.
        </>
      ),
      roles: (
        <>
          Beauty Artist para Noivas · Especialista em Cabelo
          <br />
          Maquiadora · Beleza para Eventos
        </>
      ),
      discoverStory: "Conheça sua história",
      letsMeet: "Vamos conversar",
      bridalPhotoCaption: "SEU DIA. SUA BELEZA. SEU MOMENTO.",
      bridalEyebrow: "LINDA DESDE O PRIMEIRO MOMENTO",
      bridalTitle: (
        <>
          A experiência
          <br />
          <em>da noiva.</em>
        </>
      ),
      bridalText:
        "Da primeira conversa ao toque final. Cabelo e maquiagem que refletem quem você é, para um dia inteiramente seu.",
      requestConsultation: "Solicitar consulta para noiva",
      introEyebrow: "UMA ABORDAGEM PESSOAL PARA A BELEZA",
      servicesEyebrow: "BELEZA EM CADA CAPÍTULO",
      servicesTitle: (
        <>
          Criado ao redor de <em>você.</em>
        </>
      ),
      exploreServices: "Ver serviços",
      selectedWork: "TRABALHOS SELECIONADOS",
      viewPortfolio: "Ver portfólio",
      signatureEyebrow: "OS DETALHES FAZEM A DIFERENÇA",
      signatureLooks: [
        "Coque romântico",
        "Ondas Hollywood",
        "Coque moderno de noiva",
        "Semipreso suave",
      ],
      guideEyebrow: "COMECE COM UMA CONVERSA",
      guideTitle: "Planeje sua experiência de beleza.",
      guideText:
        "Conte sobre seu casamento, celebração ou atendimento e a equipe de Miriã responderá com o próximo passo.",
      clientLoveEyebrow: "PALAVRAS PARA LEMBRAR",
      awaitingStories: "Aguardando depoimentos aprovados",
      followBeauty: "Acompanhe a beleza.",
      pageEyebrow: "MIRIÃ COTRIM · BELEZA PARA NOIVAS",
      careBehind: "O CUIDADO POR TRÁS DE CADA LOOK",
      behindSteps: [
        "Consulta",
        "Preparação",
        "Styling",
        "Toques finais",
        "Look final",
      ],
      specialEvents: "Eventos especiais",
      specialEventsText:
        "Cabelo e maquiagem personalizados para aniversários, celebrações, ensaios e momentos que merecem ser lembrados.",
      planEventLook: "Planejar look para evento",
      hairTitle: "Cabelo cuidado com intenção.",
      hairText:
        "Conheça cortes, penteados, tratamentos e transformações em uma consulta personalizada.",
      exploreAppointment: "Conhecer agendamento",
      bridalFormEyebrow: "CONTE SOBRE O SEU DIA",
      bridalFormTitle: (
        <>
          Planeje sua experiência
          <br />
          <em>de beleza para noiva.</em>
        </>
      ),
      contactTitle: (
        <>
          Sua história começa
          <br />
          <em>com uma conversa.</em>
        </>
      ),
      contactText:
        "Beleza para noivas, uma ocasião especial, um novo look ou um pedido personalizado para evento. Envie uma mensagem e a equipe de Miriã responderá.",
      exploreAppointments: "Ver agendamentos",
      footerTagline: "BELEZA PARA NOIVAS",
      footerCopy: (
        <>
          Beleza pessoal.
          <br />
          Momentos inesquecíveis.
        </>
      ),
      explore: "EXPLORE",
      letsConnect: "VAMOS CONVERSAR",
      contact: "Contato",
      email: "E-mail",
      footerPolicies: [
        { label: "Política de Privacidade", href: "/privacy" },
        { label: "Termos", href: "/terms" },
        { label: "Política de Cancelamento", href: "/cancellation" },
      ],
      policyNotice:
        "As políticas finais devem ser revisadas e publicadas antes do lançamento.",
      whatsappMissing:
        "Adicione o WhatsApp oficial de Miriã em app/siteContent.ts antes do lançamento.",
      whatsappText:
        "Ola%20Miria%2C%20gostaria%20de%20saber%20mais%20sobre%20seus%20servicos.",
      whatsappLabel: "Falar com Miriã no WhatsApp",
      whatsappButton: "Falar com Miriã",
    },
    legal: {
      privacy: {
        title: "Política de Privacidade",
        updated: "Última atualização: outubro de 2026",
        intro:
          "Esta Política de Privacidade explica como Miriã Cotrim Bridal Beauty pode coletar, usar e proteger informações enviadas por meio deste website. Este é um modelo geral e deve ser revisado por um profissional qualificado antes da publicação final.",
        sections: [
          {
            heading: "Informações que coletamos",
            body: [
              "Podemos coletar informações enviadas voluntariamente nos formulários de contato, consulta para noivas, agendamento e newsletter, incluindo nome, e-mail, telefone ou WhatsApp, detalhes do evento, serviço solicitado, data preferida e mensagem.",
              "O website também pode coletar informações técnicas limitadas, como navegador, dispositivo e dados de uso, por meio de ferramentas padrão de hospedagem, análise ou segurança.",
            ],
          },
          {
            heading: "Como usamos suas informações",
            body: [
              "Usamos as informações enviadas para responder solicitações, verificar disponibilidade de agenda, preparar propostas de serviços de beleza ou noivas, gerenciar pedidos de agendamento pendentes e enviar atualizações ocasionais quando houver consentimento.",
              "Não vendemos informações pessoais. As informações podem ser compartilhadas apenas com provedores que ajudam a operar o website, armazenar envios de formulários, gerenciar calendários ou enviar notificações.",
            ],
          },
          {
            heading: "Agendamentos e informações de calendário",
            body: [
              "Quando você solicita um agendamento, o website pode salvar o pedido em um banco de dados seguro e criar um evento pendente de calendário para revisão interna. Um pedido enviado não é um agendamento confirmado até a confirmação da equipe.",
            ],
          },
          {
            heading: "Armazenamento e segurança",
            body: [
              "Os envios de formulários podem ser armazenados em sistemas como Supabase e processados por ferramentas usadas para operar o website. Medidas razoáveis são usadas para proteger essas informações, mas nenhum sistema online pode ser garantido como totalmente seguro.",
            ],
          },
          {
            heading: "Suas escolhas",
            body: [
              "Você pode solicitar correção ou exclusão das informações enviadas, ou pedir para deixar de receber mensagens opcionais de marketing, entrando em contato com a empresa pelos canais informados no website.",
            ],
          },
        ],
      },
      terms: {
        title: "Termos de Serviço",
        updated: "Última atualização: outubro de 2026",
        intro:
          "Estes Termos descrevem as condições gerais para uso deste website e para solicitação de serviços de beleza, noivas, cabelo e maquiagem da Miriã Cotrim Bridal Beauty. São apresentados como um modelo customizável e devem ser revisados antes da publicação final.",
        sections: [
          {
            heading: "Uso do website",
            body: [
              "Este website apresenta informações sobre serviços de beleza, serviços para noivas, portfólio, canais de contato e ferramentas de solicitação de agendamento. Ao usar o website, você concorda em utilizá-lo apenas para fins legais e adequados.",
            ],
          },
          {
            heading: "Informações sobre serviços",
            body: [
              "Descrições de serviços, durações, disponibilidade e preços podem mudar e são fornecidos como informação geral. Detalhes finais de serviço, horário, local, disponibilidade da equipe e eventuais deslocamentos devem ser confirmados diretamente com a empresa.",
            ],
          },
          {
            heading: "Solicitações de agendamento",
            body: [
              "Enviar um formulário de agendamento não garante o atendimento. Os pedidos são revisados e permanecem pendentes até confirmação pela proprietária ou equipe. O website pode mostrar horários disponíveis com base no calendário, mas a confirmação final é necessária.",
            ],
          },
          {
            heading: "Responsabilidades da cliente",
            body: [
              "A cliente é responsável por fornecer dados de contato, informações do evento, preferências de serviço e requisitos de horário ou local de forma correta. Informações incorretas ou incompletas podem atrasar a confirmação.",
            ],
          },
          {
            heading: "Portfólio e conteúdo",
            body: [
              "Imagens, vídeos, textos, marca e materiais de portfólio deste website são apresentados para fins de divulgação e não podem ser copiados ou reutilizados sem autorização.",
            ],
          },
        ],
      },
      cancellation: {
        title: "Política de Cancelamento",
        updated: "Última atualização: outubro de 2026",
        intro:
          "Esta Política de Cancelamento apresenta uma estrutura geral para atendimentos de beleza, noivas, cabelo e maquiagem. Ela deve ser customizada com as regras finais de depósito, prazos e reembolso antes do lançamento.",
        sections: [
          {
            heading: "Solicitações pendentes",
            body: [
              "Uma solicitação enviada pelo website não está confirmada até aprovação da empresa. Pedidos pendentes podem ser recusados ou ajustados caso a data, horário, local ou serviço solicitado não esteja disponível.",
            ],
          },
          {
            heading: "Agendamentos confirmados",
            body: [
              "Após a confirmação do agendamento, a cliente deve avisar a empresa o quanto antes caso precise remarcar ou cancelar. A remarcação depende da disponibilidade da agenda e não é garantida.",
            ],
          },
          {
            heading: "Depósitos e reservas",
            body: [
              "Se houver exigência de depósito ou reserva, o valor, prazo de pagamento e possibilidade de reembolso devem ser confirmados por escrito antes da finalização do atendimento ou pacote de noiva.",
            ],
          },
          {
            heading: "Atrasos e não comparecimento",
            body: [
              "Atrasos podem reduzir o tempo disponível para o serviço e afetar o resultado final. Faltas ou não comparecimento podem estar sujeitos a taxas de cancelamento após aprovação da política final da empresa.",
            ],
          },
          {
            heading: "Serviços de noivas e eventos",
            body: [
              "Reservas para noivas e eventos podem exigir planejamento de horários, deslocamento, assistentes ou reserva da data. As regras de cancelamento para esses serviços devem ser confirmadas em proposta ou contrato escrito.",
            ],
          },
        ],
      },
    } satisfies Record<string, LegalDocument>,
  },
};

const TranslationContext = createContext(i18n.EN);

function useTranslation() {
  return useContext(TranslationContext);
}

const ButtonLink = ({
  href,
  children,
  light = false,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  light?: boolean;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}) => (
  <Link
    className={`btn ${light ? "light" : ""}`}
    href={href}
    onClick={onClick}
    scroll={onClick ? false : undefined}
  >
    {children}
    <ArrowUpRight size={17} />
  </Link>
);

function Photo({
  id,
  alt = "Hair styling by Miriã Cotrim",
  className = "",
  priority = false,
}: {
  id: number;
  alt?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <img
      className={className}
      src={photo(id)}
      srcSet={`${photo(id, true)} 540w, ${photo(id)} 1400w`}
      sizes="(max-width: 600px) 100vw, 50vw"
      alt={alt}
      loading={priority ? "eager" : "lazy"}
    />
  );
}

function Field({
  label: fieldLabel,
  name,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  type?: FieldType;
  required?: boolean;
}) {
  return (
    <label className="field">
      {fieldLabel}
      <input
        name={name}
        type={type}
        required={required}
        min={type === "number" ? 0 : undefined}
      />
    </label>
  );
}

function TextArea({
  label: fieldLabel,
  name,
  required = false,
}: {
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <label className="field">
      {fieldLabel}
      <textarea name={name} rows={4} required={required} />
    </label>
  );
}

function formDataToObject(form: HTMLFormElement) {
  return Object.fromEntries(new FormData(form).entries());
}

function formValue(data: Record<string, unknown>, key: string) {
  const value = data[key];
  return typeof value === "string" ? value.trim() : "";
}

function isEmailFormat(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhoneFormat(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

function validateSubmission(
  data: Record<string, unknown>,
  requiredFields: Array<{ key: string; label: string }>,
  ui: {
    validationTitle: string;
    completeFields: string;
    invalidEmail: string;
    invalidPhone: string;
  },
  options: { phoneRequired?: boolean } = {},
): SubmitFeedback | null {
  const missingFields = requiredFields.filter(({ key }) => !formValue(data, key));

  if (missingFields.length) {
    return {
      title: ui.validationTitle,
      message: `${ui.completeFields}: ${missingFields
        .map(({ label: fieldLabel }) => fieldLabel)
        .join(", ")}.`,
    };
  }

  const email = formValue(data, "email");
  if (email && !isEmailFormat(email)) {
    return {
      title: ui.validationTitle,
      message: ui.invalidEmail,
    };
  }

  const phone = formValue(data, "phone");
  if ((phone || options.phoneRequired) && !isPhoneFormat(phone)) {
    return {
      title: ui.validationTitle,
      message: ui.invalidPhone,
    };
  }

  return null;
}

async function submitJson(endpoint: string, body: Record<string, unknown>) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const result = (await response.json().catch(() => ({}))) as Partial<SubmitResponse>;
  if (!response.ok) {
    throw new Error(
      typeof result.error === "string"
        ? result.error
        : "We could not send your request right now.",
    );
  }

  return result;
}

function successFeedback(
  result: Partial<SubmitResponse>,
  fallback: SubmitFeedback,
  useServerCopy = true,
) {
  return {
    title: useServerCopy ? result.title || fallback.title : fallback.title,
    message: useServerCopy ? result.message || fallback.message : fallback.message,
  };
}

function errorFeedback(
  error: unknown,
  fallbackTitle: string,
  fallbackMessage: string,
) {
  return {
    title: fallbackTitle,
    message: error instanceof Error ? error.message : fallbackMessage,
  };
}

function dateToYmd(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours} hr` : `${hours.toFixed(1)} hr`;
}

function translatedService(
  service: BookingService,
  content: typeof C,
) {
  const matchingService = content.services.find((item) =>
    service.name.toLowerCase().includes(item.name.toLowerCase()) ||
    item.name.toLowerCase().includes(service.name.toLowerCase()),
  );

  return matchingService?.name || service.name;
}

function SubmitState({
  status,
  feedback,
}: {
  status: FormStatus;
  feedback: SubmitFeedback | null;
}) {
  if (status === "idle" || !feedback) {
    return null;
  }

  const Icon = status === "success" ? Check : status === "error" ? AlertCircle : MessageCircle;

  return (
    <div
      className={`formfeedback ${status}`}
      role={status === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      <Icon />
      <div>
        <h3>{feedback.title}</h3>
        <p>{feedback.message}</p>
      </div>
    </div>
  );
}

function ContactForm({ source = "contact_page" }: { source?: string }) {
  const { labels, feedback: feedbackText, ui, language } = useTranslation();
  const [status, setStatus] = useState<FormStatus>("idle");
  const [feedback, setFeedback] = useState<SubmitFeedback | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = formDataToObject(form);
    const validation = validateSubmission(
      formData,
      [
        { key: "name", label: labels.name },
        { key: "email", label: labels.email },
        { key: "message", label: labels.message },
      ],
      ui,
    );

    if (validation) {
      setFeedback(validation);
      setStatus("error");
      return;
    }

    setStatus("loading");
    setFeedback(feedbackText.contact.loading);

    try {
      const result = await submitJson("/api/contact", {
        ...formData,
        source,
      });
      form.reset();
      setFeedback(
        successFeedback(result, feedbackText.contact.success, language === "EN"),
      );
      setStatus("success");
    } catch (requestError) {
      setFeedback(
        errorFeedback(
          requestError,
          feedbackText.contact.errorTitle,
          "We could not send your message right now.",
        ),
      );
      setStatus("error");
    }
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <div className="formgrid">
        <Field label={labels.name} name="name" required />
        <Field label={labels.email} name="email" type="email" required />
        <Field label={labels.phone} name="phone" type="tel" />
      </div>
      <TextArea label={labels.message} name="message" required />
      <SubmitState status={status} feedback={feedback} />
      {status !== "success" && (
        <button className="btn" type="submit" disabled={status === "loading"}>
          {status === "loading" ? ui.sending : ui.sendMessage}
          <ArrowUpRight size={17} />
        </button>
      )}
    </form>
  );
}

function NewsletterForm() {
  const { labels, feedback: feedbackText, ui, language } = useTranslation();
  const [status, setStatus] = useState<FormStatus>("idle");
  const [feedback, setFeedback] = useState<SubmitFeedback | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = formDataToObject(form);
    const validation = validateSubmission(
      formData,
      [{ key: "email", label: labels.email }],
      ui,
    );

    if (validation) {
      setFeedback(validation);
      setStatus("error");
      return;
    }

    setStatus("loading");
    setFeedback(feedbackText.newsletter.loading);

    try {
      const result = await submitJson("/api/newsletter", {
        ...formData,
        source: "footer_beauty_list",
      });
      form.reset();
      setFeedback(
        successFeedback(result, feedbackText.newsletter.success, language === "EN"),
      );
      setStatus("success");
    } catch (requestError) {
      setFeedback(
        errorFeedback(
          requestError,
          feedbackText.newsletter.errorTitle,
          "We could not add you to the beauty list right now.",
        ),
      );
      setStatus("error");
    }
  }

  if (status === "success") {
    return <SubmitState status={status} feedback={feedback} />;
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <Field label={labels.name} name="name" />
      <Field label={labels.email} name="email" type="email" required />
      <input name="consent" type="hidden" value="true" />
      <SubmitState status={status} feedback={feedback} />
      <button className="btn" type="submit" disabled={status === "loading"}>
        {status === "loading" ? ui.joining : ui.joinBeautyList}
        <ArrowUpRight size={17} />
      </button>
      <p className="note">{ui.newsletterNote}</p>
    </form>
  );
}

function BridalInquiryForm() {
  const { content, labels, feedback: feedbackText, ui, language } = useTranslation();
  const [status, setStatus] = useState<FormStatus>("idle");
  const [feedback, setFeedback] = useState<SubmitFeedback | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = formDataToObject(form);
    const validation = validateSubmission(
      formData,
      [
        { key: "bride_name", label: ui.brideName },
        { key: "email", label: labels.email },
        { key: "phone", label: labels.phone },
        { key: "event_date", label: labels.eventDate },
        { key: "event_location", label: labels.eventLocation },
        { key: "service_type", label: labels.serviceType },
        { key: "details", label: labels.details },
      ],
      ui,
      { phoneRequired: true },
    );

    if (validation) {
      setFeedback(validation);
      setStatus("error");
      return;
    }

    setStatus("loading");
    setFeedback(feedbackText.bridal.loading);

    try {
      const result = await submitJson("/api/bridal", formData);
      form.reset();
      setFeedback(
        successFeedback(result, feedbackText.bridal.success, language === "EN"),
      );
      setStatus("success");
    } catch (requestError) {
      setFeedback(
        errorFeedback(
          requestError,
          feedbackText.bridal.errorTitle,
          "We could not send your bridal inquiry right now.",
        ),
      );
      setStatus("error");
    }
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <div className="formgrid">
        <Field label={ui.brideName} name="bride_name" required />
        <Field label={labels.email} name="email" type="email" required />
        <Field label={labels.phone} name="phone" type="tel" required />
        <Field label={labels.eventDate} name="event_date" type="date" required />
        <Field label={labels.eventLocation} name="event_location" required />
        <label className="field">
          {labels.serviceType}
          <select name="service_type" required>
            <option value="">{ui.selectService}</option>
            {content.bridalServices.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </label>
      </div>
      <TextArea label={labels.details} name="details" required />
      <SubmitState status={status} feedback={feedback} />
      {status !== "success" && (
        <button className="btn" type="submit" disabled={status === "loading"}>
          {status === "loading" ? ui.sending : ui.requestBridalProposal}
          <ArrowUpRight size={17} />
        </button>
      )}
    </form>
  );
}

function BookingRequestForm({
  service,
  slot,
  onSuccess,
  onStartOver,
}: {
  service: BookingService;
  slot: AvailabilitySlot;
  onSuccess: () => void;
  onStartOver: () => void;
}) {
  const { content, labels, feedback: feedbackText, ui, language } = useTranslation();
  const [status, setStatus] = useState<FormStatus>("idle");
  const [feedback, setFeedback] = useState<SubmitFeedback | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = formDataToObject(form);
    const validation = validateSubmission(
      formData,
      [
        { key: "name", label: labels.name },
        { key: "email", label: labels.email },
        { key: "phone", label: labels.phone },
      ],
      ui,
      { phoneRequired: true },
    );

    if (validation) {
      setFeedback(validation);
      setStatus("error");
      return;
    }

    setStatus("loading");
    setFeedback(feedbackText.booking.loading);

    try {
      const result = await submitJson("/api/booking", {
        ...formData,
        service_slug: service.slug,
        requested_service: service.name,
        requested_start: slot.start_iso,
        requested_end: slot.end_iso,
        time_zone: slot.time_zone,
      });
      form.reset();
      setFeedback(
        successFeedback(result, feedbackText.booking.success, language === "EN"),
      );
      setStatus("success");
      onSuccess();
    } catch (requestError) {
      setFeedback(
        errorFeedback(
          requestError,
          feedbackText.booking.errorTitle,
          "We could not send your booking request right now.",
        ),
      );
      setStatus("error");
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="summary">
        {translatedService(service, content)} · {formatDuration(service.duration_minutes)}
        <br />
        {new Date(`${slot.date}T12:00:00`).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}{" "}
        · {slot.start_label} to {slot.end_label}
      </div>
      {status !== "success" && (
        <>
          <div className="formgrid">
            <Field label={labels.name} name="name" required />
            <Field label={labels.email} name="email" type="email" required />
            <Field label={labels.phone} name="phone" type="tel" required />
          </div>
          <TextArea label={labels.notes} name="notes" />
        </>
      )}
      <SubmitState status={status} feedback={feedback} />
      {status === "success" ? (
        <button className="textlink" onClick={onStartOver} type="button">
          {ui.startAnotherRequest}
          <ArrowRight size={16} />
        </button>
      ) : (
        <button className="btn" type="submit" disabled={status === "loading"}>
          {status === "loading" ? ui.sending : content.copy.submit}
          <ArrowRight size={16} />
        </button>
      )}
    </form>
  );
}

function Booking() {
  const { content, ui } = useTranslation();
  const [step, setStep] = useState(0);
  const [services, setServices] = useState<BookingService[]>([]);
  const [serviceSlug, setServiceSlug] = useState("");
  const [date, setDate] = useState<Date>();
  const [slot, setSlot] = useState<AvailabilitySlot>();
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [availabilityWarning, setAvailabilityWarning] = useState("");
  const [bookingComplete, setBookingComplete] = useState(false);
  const selectedService = useMemo(
    () => services.find((item) => item.slug === serviceSlug),
    [services, serviceSlug],
  );
  const selectedDate = date ? dateToYmd(date) : "";
  const titles = ui.bookingSteps;

  useEffect(() => {
    let active = true;

    async function loadServices() {
      setServicesLoading(true);
      setLoadError("");

      try {
        const response = await fetch("/api/services");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "We could not load services.");
        }

        if (active) {
          setServices(result.services || []);
        }
      } catch (error) {
        if (active) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "We could not load services right now.",
          );
        }
      } finally {
        if (active) {
          setServicesLoading(false);
        }
      }
    }

    loadServices();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedService || !selectedDate) {
      setAvailability([]);
      setSlot(undefined);
      return;
    }

    let active = true;
    const serviceForRequest = selectedService;

    async function loadAvailability() {
      setAvailabilityLoading(true);
      setAvailabilityWarning("");
      setLoadError("");
      setSlot(undefined);

      try {
        const params = new URLSearchParams({
          service: serviceForRequest.slug,
          start: selectedDate,
          end: selectedDate,
        });
        const response = await fetch(`/api/availability?${params.toString()}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "We could not load availability.");
        }

        if (active) {
          setAvailability(result.slots || []);
          setAvailabilityWarning(result.warning || "");
        }
      } catch (error) {
        if (active) {
          setAvailability([]);
          setLoadError(
            error instanceof Error
              ? error.message
              : "We could not load availability right now.",
          );
        }
      } finally {
        if (active) {
          setAvailabilityLoading(false);
        }
      }
    }

    loadAvailability();
    return () => {
      active = false;
    };
  }, [selectedService, selectedDate]);

  return (
    <div className="booking">
      <aside>
        <span className="eyebrow">A MOMENT, JUST FOR YOU</span>
        <h2>
          {ui.bookingTitle}
        </h2>
        <p>{ui.bookingIntro}</p>
        <ol>
          {titles.map((title, index) => (
            <li key={title} className={step === index ? "active" : ""}>
              <span>0{index + 1}</span>
              {title}
            </li>
          ))}
        </ol>
      </aside>
      <div className="bookingbody">
        <span className="eyebrow">{ui.step} {Math.min(step + 1, 4)} / 4</span>
        <h3>{titles[step]}</h3>
        {loadError && (
          <p className="formmessage error" role="alert">
            {loadError}
          </p>
        )}
        {step === 0 && (
          <div className="options">
            {servicesLoading && <p>{ui.loadingServices}</p>}
            {!servicesLoading && services.map((item) => (
              <button
                aria-pressed={serviceSlug === item.slug}
                className={serviceSlug === item.slug ? "selected" : ""}
                key={item.slug}
                onClick={() => {
                  setServiceSlug(item.slug);
                  setDate(undefined);
                  setSlot(undefined);
                  setBookingComplete(false);
                }}
                type="button"
              >
                <span>
                  {translatedService(item, content)}
                  <small>
                    {formatDuration(item.duration_minutes)} ·{" "}
                    {item.location_type === "ask_invitee"
                      ? ui.detailsConfirmed
                      : ui.inPerson}
                  </small>
                </span>
                <ArrowUpRight size={16} />
              </button>
            ))}
          </div>
        )}
        {step === 1 && (
          <>
            {selectedService && (
              <p className="note">
                {translatedService(selectedService, content)} {ui.estimatedAt}{" "}
                {formatDuration(selectedService.duration_minutes)}. {ui.filteredByLength}
              </p>
            )}
            <Calendar
              mode="single"
              selected={date}
              onSelect={(selectedDate) => {
                setDate(selectedDate);
                setBookingComplete(false);
              }}
              disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
              className="bookcalendar"
            />
          </>
        )}
        {step === 2 && (
          <>
            {availabilityWarning && <p className="note">{availabilityWarning}</p>}
            {availabilityLoading && <p>{ui.checkingAvailability}</p>}
            {!availabilityLoading && selectedDate && (
              <p className="note">
                {availability.length
                  ? `${ui.availableTimesFor} ${new Date(
                      `${selectedDate}T12:00:00`,
                    ).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                    })}.`
                  : ui.noAvailableTimes}
              </p>
            )}
            <div className="times">
              {availability.map((item) => (
                <button
                  className={slot?.id === item.id ? "selected" : ""}
                  key={item.id}
                  onClick={() => {
                    setSlot(item);
                    setBookingComplete(false);
                  }}
                  type="button"
                >
                  {item.start_label}
                  <small>{ui.until} {item.end_label}</small>
                </button>
              ))}
            </div>
          </>
        )}
        {step === 3 && selectedService && slot && (
          <BookingRequestForm
            service={selectedService}
            slot={slot}
            onSuccess={() => setBookingComplete(true)}
            onStartOver={() => {
              setServiceSlug("");
              setDate(undefined);
              setSlot(undefined);
              setAvailability([]);
              setBookingComplete(false);
              setStep(0);
            }}
          />
        )}
        {!bookingComplete && (
          <div className="stepnav">
            {step > 0 && (
              <button className="textlink" onClick={() => setStep(step - 1)} type="button">
                <ChevronLeft size={16} />
                {content.copy.back}
              </button>
            )}
            {step < 3 && (
              <button
                className="btn"
                disabled={
                  step === 0
                    ? !serviceSlug
                    : step === 1
                      ? !date
                      : !slot
                }
                onClick={() => setStep(step + 1)}
                type="button"
              >
                {content.copy.next}
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Gallery({ short = false }: { short?: boolean }) {
  const { categories: categoryValues, categoryLabels, portfolioLabels, ui } = useTranslation();
  const categoryText = categoryLabels as Record<string, string>;
  const portfolioText = portfolioLabels as Record<string, string>;
  const [filter, setFilter] = useState("All");
  const [index, setIndex] = useState<number | null>(null);
  const filtered = (short ? portfolio.slice(0, 6) : portfolio).filter(
    (item) => filter === "All" || item.category === filter,
  );

  function move(direction: number) {
    setIndex((current) =>
      current === null ? null : (current + direction + filtered.length) % filtered.length,
    );
  }

  return (
    <>
      <div className="filters">
        {(short ? categoryValues.slice(0, 5) : categoryValues).map((category) => (
          <button
            key={category}
            className={filter === category ? "active" : ""}
            onClick={() => {
              setFilter(category);
              setIndex(null);
            }}
            type="button"
          >
            {categoryText[category] || category}
          </button>
        ))}
      </div>
      <div className="masonry">
        {filtered.map((item, itemIndex) => (
          <button
            key={item.id}
            className="galleryitem"
            onClick={() => setIndex(itemIndex)}
            aria-label={`${ui.viewLook} ${portfolioText[item.category] || item.category}`}
            type="button"
          >
            <Photo id={item.id} alt={`${item.category} by Miriã Cotrim`} />
            <span>
              {portfolioText[item.category] || item.category}
              <Plus size={18} />
            </span>
          </button>
        ))}
      </div>
      <Dialog open={index !== null} onOpenChange={(open) => !open && setIndex(null)}>
        <DialogContent
          className="lightbox"
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") move(1);
            if (event.key === "ArrowLeft") move(-1);
          }}
        >
          <DialogTitle>
            {index !== null
              ? portfolioText[filtered[index]?.category] || filtered[index]?.category
              : ""}
          </DialogTitle>
          <DialogDescription>{ui.hairArtistry}</DialogDescription>
          {index !== null && (
            <img src={photo(filtered[index].id)} alt={filtered[index].category} />
          )}
          <div className="lightnav">
            <button aria-label={ui.previousPhoto} onClick={() => move(-1)} type="button">
              <ChevronLeft />
              {ui.previous}
            </button>
            <span>
              {(index ?? 0) + 1} / {filtered.length}
            </span>
            <button aria-label={ui.nextPhoto} onClick={() => move(1)} type="button">
              {ui.next}
              <ChevronRight />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ServiceCards() {
  const { content } = useTranslation();
  return (
    <div className="servicegrid">
      {content.services.map((service, index) => (
        <Link href={service.href} key={service.name} className="servicecard">
          <div className="photo">
            <Photo id={service.image} />
            <span>0{index + 1}</span>
          </div>
          <h3>
            {service.name}
            <ArrowUpRight size={20} />
          </h3>
          <p>{service.sub}</p>
        </Link>
      ))}
    </div>
  );
}

function HeroFilm({
  onCredit,
  onNavigate,
}: {
  onCredit: () => void;
  onNavigate: (event: MouseEvent<HTMLAnchorElement>, href: string) => void;
}) {
  const { content, ui } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);

  function toggleVideo() {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (video.paused) {
      video
        .play()
        .then(() => setPaused(false))
        .catch(() => setPaused(true));
    } else {
      video.pause();
      setPaused(true);
    }
  }

  return (
    <section className="hero hero-film">
      <div className="film-background">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          loop
          preload="metadata"
          poster="/video/hero-poster.jpg"
          aria-label={ui.filmLabel}
          onPlay={() => setPaused(false)}
          onPause={() => setPaused(true)}
        >
          <source
            src="/video/hero-mobile.mp4"
            media="(max-width: 600px)"
            type="video/mp4"
          />
          <source src="/video/hero-desktop.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="herocopy">
        <span className="eyebrow">{content.copy.eyebrow}</span>
        <h1
          dangerouslySetInnerHTML={{
            __html: `${content.copy.hero} <em>${content.copy.heroEm}</em> ${content.copy.heroEnd}`,
          }}
        />
        <p>{content.copy.heroSub}</p>
        <div className="heroactions">
          <ButtonLink
            href="/book"
            onClick={(event) => onNavigate(event, "/book")}
          >
            {content.copy.book}
          </ButtonLink>
          <Link
            className="textlink"
            href="/bridal"
            onClick={(event) => onNavigate(event, "/bridal")}
            scroll={false}
          >
            {content.copy.explore}
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
      <div className="film-bottom">
        <Link
          href="/"
          className="film-brand"
          onClick={(event) => onNavigate(event, "/")}
          scroll={false}
        >
          MIRIÃ COTRIM · BRIDAL BEAUTY
        </Link>
        <div>
          <button className="film-credit" onClick={onCredit} type="button">
            {ui.filmCredit}
          </button>
          <button
            className="film-toggle"
            onClick={toggleVideo}
            type="button"
            aria-label={paused ? ui.playFilm : ui.pauseFilm}
          >
            {paused ? `▶ ${ui.playFilm}` : `Ⅱ ${ui.pauseFilm}`}
          </button>
        </div>
      </div>
    </section>
  );
}

function About({ full = false }: { full?: boolean }) {
  const { content, ui } = useTranslation();
  return (
    <section className="about section">
      <div className="portrait">
        <Photo id={5} alt="Miriã Cotrim, beauty artist" />
        <span className="portraitcaption">{ui.artistCaption}</span>
      </div>
      <div>
        <span className="eyebrow">{ui.aboutEyebrow}</span>
        <h2>
          {content.copy.about}
          <span className="serifitalic">{ui.aboutDetail}</span>
        </h2>
        <p>{content.professional.bio}</p>
        <p className="roles">{ui.roles}</p>
        {!full ? (
          <ButtonLink href="/about">{ui.discoverStory}</ButtonLink>
        ) : (
          <ButtonLink href="/book">{ui.letsMeet}</ButtonLink>
        )}
      </div>
    </section>
  );
}

function Bridal({ full = false }: { full?: boolean }) {
  const { content, ui } = useTranslation();
  return (
    <section className="bridalfeature">
      <div className="bridalphoto">
        <Photo id={27} />
        <span>{ui.bridalPhotoCaption}</span>
      </div>
      <div className="bridaltext">
        <span className="eyebrow">{ui.bridalEyebrow}</span>
        <h2>{ui.bridalTitle}</h2>
        <p>{ui.bridalText}</p>
        <div className="bridalservices">
          {content.bridalServices.slice(0, full ? 9 : 6).map((service) => (
            <span key={service}>{service}</span>
          ))}
        </div>
        <ButtonLink href={full ? "#bridal-inquiry" : "/bridal"} light>
          {ui.requestConsultation}
        </ButtonLink>
      </div>
    </section>
  );
}

function LegalPage({ document }: { document: LegalDocument }) {
  return (
    <section className="section legalpage">
      <span className="eyebrow">{document.updated}</span>
      <h1>{document.title}</h1>
      <p className="legalintro">{document.intro}</p>
      <div className="legalcontent">
        {document.sections.map((section) => (
          <article key={section.heading}>
            <h2>{section.heading}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </article>
        ))}
      </div>
    </section>
  );
}

export default function Site({ page }: { page: string }) {
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [notice, setNotice] = useState("");
  const [language, setLanguage] = useState<Language>("EN");
  const translation = i18n[language];
  const { content, pageTitles: translatedPageTitles, ui } = translation;
  const pageTitleText = translatedPageTitles as Record<string, string>;
  const legalDocument =
    translation.legal[page as keyof typeof translation.legal] || null;
  const home = page === "home";
  const contactEmail = content.contact.email;
  const whatsappNumber = content.contact.WHATSAPP_NUMBER;
  const visibleNavigation = useMemo(() => content.navigation, [content.navigation]);

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("miria-site-language");

    if (savedLanguage === "EN" || savedLanguage === "PT") {
      setLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("miria-site-language", language);
    document.documentElement.lang = language === "PT" ? "pt-BR" : "en";
  }, [language]);

  useEffect(() => {
    document.title = home
      ? content.seo.title
      : `${pageTitleText[page] || page.charAt(0).toUpperCase() + page.slice(1)} | Miriã Cotrim`;
  }, [content.seo.title, home, page, pageTitleText]);

  const scrollToPageTarget = useCallback(
    (hash = "", behavior: ScrollBehavior = "auto") => {
    window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        if (!hash) {
          window.scrollTo({ top: 0, left: 0, behavior });
          return;
        }

        const target = document.getElementById(hash);
        if (!target) {
          return;
        }

        const headerHeight =
          document.querySelector<HTMLElement>(".header")?.offsetHeight ?? 0;
        const targetTop =
          target.getBoundingClientRect().top + window.scrollY - headerHeight;

        window.scrollTo({
          top: Math.max(0, targetTop),
          left: 0,
          behavior,
        });
      }, 35);
    });
    },
    [],
  );

  useEffect(() => {
    scrollToPageTarget(window.location.hash.replace("#", ""));
  }, [page, scrollToPageTarget]);

  const showNotice = (message: string) => setNotice(message);
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${ui.whatsappText}`
    : "";
  const isCurrentPage = (href: string) =>
    href === "/" ? home : page === href.replace(/^\/|\/$/g, "");
  const handleNavigationClick = (
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    const [path, hash] = href.split("#");
    const targetPath = path || window.location.pathname;
    const currentPath = window.location.pathname;

    event.preventDefault();
    setMenu(false);

    if (targetPath === currentPath) {
      scrollToPageTarget(hash || "", "smooth");
      return;
    }

    router.push(href, { scroll: false });
  };

  return (
    <TranslationContext.Provider value={translation}>
      <header className="header">
        <Link
          href="/"
          className="brand"
          aria-label="Miriã Cotrim home"
          onClick={(event) => handleNavigationClick(event, "/")}
          scroll={false}
        >
          <img src={photo(1)} alt="Miriã Cotrim Bridal Beauty logo" />
        </Link>
        <nav className="desktopnav">
          {visibleNavigation.map(([name, href]) => (
            <Link
              className={isCurrentPage(href) ? "current" : ""}
              key={name}
              href={href}
              onClick={(event) => handleNavigationClick(event, href)}
              scroll={false}
            >
              {name}
            </Link>
          ))}
        </nav>
        <div className="headeractions">
          <button
            className="language"
            onClick={() => {
              setLanguage(language === "EN" ? "PT" : "EN");
            }}
            type="button"
          >
            {language === "EN" ? "PT" : "EN"} <span>⌄</span>
          </button>
          <Link
            href="/book"
            className="navbook"
            onClick={(event) => handleNavigationClick(event, "/book")}
            scroll={false}
          >
            {ui.navBook}
            <ArrowUpRight size={15} />
          </Link>
          <button
            className="menubtn"
            aria-label={ui.openMenu}
            onClick={() => setMenu(true)}
            type="button"
          >
            <Menu />
          </button>
        </div>
      </header>

      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent className="mobilemenu">
          <SheetTitle>{content.brand.name}</SheetTitle>
          <SheetDescription>{content.brand.tagline}</SheetDescription>
          {visibleNavigation.map(([name, href]) => (
            <Link
              key={name}
              href={href}
              onClick={(event) => handleNavigationClick(event, href)}
              scroll={false}
            >
              {name}
            </Link>
          ))}
          <ButtonLink href="/book">{ui.bookNow}</ButtonLink>
        </SheetContent>
      </Sheet>

      <main>
        {home && (
          <>
            <HeroFilm
              onNavigate={handleNavigationClick}
              onCredit={() =>
                showNotice(
                  ui.filmNotice,
                )
              }
            />

            <section className="intro section">
              <span className="eyebrow">{ui.introEyebrow}</span>
              <h2>{content.copy.position}</h2>
              <p>{content.copy.positionText}</p>
            </section>

            <section className="section services">
              <div className="sectionhead">
                <div>
                  <span className="eyebrow">{ui.servicesEyebrow}</span>
                  <h2>{ui.servicesTitle}</h2>
                </div>
                <Link className="textlink" href="/services">
                  {ui.exploreServices}
                  <ArrowUpRight size={16} />
                </Link>
              </div>
              <ServiceCards />
            </section>

            <Bridal />

            <section className="section">
              <div className="sectionhead">
                <div>
                  <span className="eyebrow">{ui.selectedWork}</span>
                  <h2>{content.copy.portfolio}</h2>
                </div>
                <Link href="/portfolio" className="textlink">
                  {ui.viewPortfolio}
                  <ArrowUpRight size={16} />
                </Link>
              </div>
              <Gallery short />
            </section>

            <About />

            <section className="section signatures">
              <span className="eyebrow">{ui.signatureEyebrow}</span>
              <h2>{content.copy.signature}</h2>
              <div className="signaturegrid">
                {[
                  [53, ui.signatureLooks[0]],
                  [21, ui.signatureLooks[1]],
                  [39, ui.signatureLooks[2]],
                  [15, ui.signatureLooks[3]],
                ].map(([id, title]) => (
                  <Link href="/portfolio" key={id}>
                    <Photo id={Number(id)} />
                    <h3>{title}</h3>
                  </Link>
                ))}
              </div>
            </section>

            <section className="guide section">
              <div>
                <span className="eyebrow">{ui.guideEyebrow}</span>
                <h2>{ui.guideTitle}</h2>
                <p>{ui.guideText}</p>
              </div>
              <ContactForm source="home_cta" />
            </section>

            <section className="clientlove section">
              <span className="eyebrow">{ui.clientLoveEyebrow}</span>
              <h2>{content.copy.clientLove}</h2>
              <div className="quotes">
                {[1, 2, 3].map((item) => (
                  <div key={item}>
                    <span>“</span>
                    <p>{content.copy.testimonial}</p>
                    <small>{ui.awaitingStories}</small>
                  </div>
                ))}
              </div>
            </section>

            <section className="section social">
              <div className="sectionhead">
                <h2>{ui.followBeauty}</h2>
                <a
                  href={content.socialMedia.Instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="textlink"
                >
                  <Camera size={17} />
                  @miriacotrim
                </a>
              </div>
              <div className="socialgrid">
                {[46, 23, 31, 35, 41].map((id) => (
                  <a href={content.socialMedia.Instagram} key={id} target="_blank" rel="noreferrer">
                    <Photo id={id} />
                  </a>
                ))}
              </div>
            </section>
          </>
        )}

        {!home && page !== "book" && !legalDocument && (
          <section className="pagetitle">
            <span className="eyebrow">{ui.pageEyebrow}</span>
            <h1>{pageTitleText[page]}</h1>
          </section>
        )}

        {legalDocument && <LegalPage document={legalDocument} />}

        {page === "about" && (
          <>
            <About full />
            <section className="section">
              <span className="eyebrow">{ui.careBehind}</span>
              <h2>{content.copy.behind}</h2>
              <div className="behindgrid">
                {[
                  [31, ui.behindSteps[0]],
                  [30, ui.behindSteps[1]],
                  [32, ui.behindSteps[2]],
                  [23, ui.behindSteps[3]],
                  [53, ui.behindSteps[4]],
                ].map(([id, title], index) => (
                  <div key={title}>
                    <Photo id={Number(id)} />
                    <h3>
                      <small>0{index + 1}</small> {title}
                    </h3>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {page === "services" && (
          <section className="section">
            <ServiceCards />
            <div className="service-detail" id="events">
              <h2>{ui.specialEvents}</h2>
              <p>{ui.specialEventsText}</p>
              <ButtonLink href="/book">{ui.planEventLook}</ButtonLink>
            </div>
            <div className="service-detail" id="hair">
              <h2>{ui.hairTitle}</h2>
              <p>{ui.hairText}</p>
              <ButtonLink href="/book">{ui.exploreAppointment}</ButtonLink>
            </div>
          </section>
        )}

        {page === "bridal" && (
          <>
            <Bridal full />
            <section className="section bridalform" id="bridal-inquiry">
              <div>
                <span className="eyebrow">{ui.bridalFormEyebrow}</span>
                <h2>{ui.bridalFormTitle}</h2>
                <Photo id={44} />
              </div>
              <BridalInquiryForm />
            </section>
          </>
        )}

        {page === "portfolio" && (
          <section className="section portfoliosection">
            <Gallery />
          </section>
        )}

        {page === "contact" && (
          <section className="section contactgrid">
            <div>
              <h2>{ui.contactTitle}</h2>
              <p>{ui.contactText}</p>
              <ButtonLink href="/book">{ui.exploreAppointments}</ButtonLink>
              <a
                href={content.socialMedia.Instagram}
                className="textlink"
                target="_blank"
                rel="noreferrer"
              >
                <Camera size={18} />
                Instagram · @miriacotrim
              </a>
              {contactEmail && <a href={`mailto:${contactEmail}`}>{contactEmail}</a>}
              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
              )}
            </div>
            <ContactForm />
          </section>
        )}

        {page === "book" && (
          <section className="section booksection">
            <Booking />
          </section>
        )}
      </main>

      <footer>
        <div className="footertop">
          <div className="footerbrand">
            <span>{content.brand.name}</span>
            <small>{ui.footerTagline}</small>
            <p>{ui.footerCopy}</p>
          </div>
          <div>
            <span className="eyebrow">{ui.explore}</span>
            {visibleNavigation.slice(1).map(([name, href]) => (
              <Link key={name} href={href}>
                {name}
              </Link>
            ))}
          </div>
          <div>
            <span className="eyebrow">{ui.letsConnect}</span>
            <Link href="/contact">{ui.contact}</Link>
            {Object.entries(content.socialMedia).map(([name, url]) =>
              url ? (
                <a key={name} href={url} target="_blank" rel="noreferrer">
                  {name}
                </a>
              ) : null,
            )}
            {contactEmail && <a href={`mailto:${contactEmail}`}>{ui.email}</a>}
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            )}
          </div>
          <div className="newsletter">
            <h3>{ui.newsletterTitle}</h3>
            <NewsletterForm />
          </div>
        </div>
        <div className="footerbottom">
          <span>
            © {new Date().getFullYear()} Miriã Cotrim Bridal Beauty
          </span>
          {content.brand.developerUrl ? (
            <a
              href={content.brand.developerUrl}
              target="_blank"
              rel="noreferrer"
            >
              {content.brand.version}
            </a>
          ) : (
            <span>{content.brand.version}</span>
          )}
          <div>
            {ui.footerPolicies.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>

      <button
        className="whatsapp"
        aria-label={ui.whatsappLabel}
        onClick={() =>
          whatsappUrl
            ? window.open(whatsappUrl, "_blank")
            : showNotice(ui.whatsappMissing)
        }
        type="button"
      >
        <MessageCircle size={22} />
        <span>{ui.whatsappButton}</span>
      </button>

      <Dialog open={!!notice} onOpenChange={(open) => !open && setNotice("")}>
        <DialogContent>
          <DialogTitle>Miriã Cotrim Bridal Beauty</DialogTitle>
          <DialogDescription>{notice}</DialogDescription>
          <button className="btn" onClick={() => setNotice("")} type="button">
            {ui.gotIt}
          </button>
        </DialogContent>
      </Dialog>
    </TranslationContext.Provider>
  );
}
