"use client";

import {
  type FormEvent,
  type MouseEvent,
  useCallback,
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
) {
  return {
    title: result.title || fallback.title,
    message: result.message || fallback.message,
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
  const [status, setStatus] = useState<FormStatus>("idle");
  const [feedback, setFeedback] = useState<SubmitFeedback | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("loading");
    setFeedback(feedbackCopy.contact.loading);

    try {
      const result = await submitJson("/api/contact", {
        ...formDataToObject(form),
        source,
      });
      form.reset();
      setFeedback(successFeedback(result, feedbackCopy.contact.success));
      setStatus("success");
    } catch (requestError) {
      setFeedback(
        errorFeedback(
          requestError,
          feedbackCopy.contact.errorTitle,
          "We could not send your message right now.",
        ),
      );
      setStatus("error");
    }
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="formgrid">
        <Field label={label.name} name="name" required />
        <Field label={label.email} name="email" type="email" required />
        <Field label={label.phone} name="phone" type="tel" />
      </div>
      <TextArea label={label.message} name="message" required />
      <SubmitState status={status} feedback={feedback} />
      {status !== "success" && (
        <button className="btn" type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Sending..." : "Send message"}
          <ArrowUpRight size={17} />
        </button>
      )}
    </form>
  );
}

function NewsletterForm() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [feedback, setFeedback] = useState<SubmitFeedback | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("loading");
    setFeedback(feedbackCopy.newsletter.loading);

    try {
      const result = await submitJson("/api/newsletter", {
        ...formDataToObject(form),
        source: "footer_beauty_list",
      });
      form.reset();
      setFeedback(successFeedback(result, feedbackCopy.newsletter.success));
      setStatus("success");
    } catch (requestError) {
      setFeedback(
        errorFeedback(
          requestError,
          feedbackCopy.newsletter.errorTitle,
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
    <form className="form" onSubmit={onSubmit}>
      <Field label="Name" name="name" />
      <Field label="Email" name="email" type="email" required />
      <input name="consent" type="hidden" value="true" />
      <SubmitState status={status} feedback={feedback} />
      <button className="btn" type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Joining..." : "Join our beauty list"}
        <ArrowUpRight size={17} />
      </button>
      <p className="note">
        Occasional beauty notes, bridal updates and appointment availability.
      </p>
    </form>
  );
}

function BridalInquiryForm() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [feedback, setFeedback] = useState<SubmitFeedback | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("loading");
    setFeedback(feedbackCopy.bridal.loading);

    try {
      const result = await submitJson("/api/bridal", formDataToObject(form));
      form.reset();
      setFeedback(successFeedback(result, feedbackCopy.bridal.success));
      setStatus("success");
    } catch (requestError) {
      setFeedback(
        errorFeedback(
          requestError,
          feedbackCopy.bridal.errorTitle,
          "We could not send your bridal inquiry right now.",
        ),
      );
      setStatus("error");
    }
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="formgrid">
        <Field label="Bride name" name="bride_name" required />
        <Field label={label.email} name="email" type="email" required />
        <Field label={label.phone} name="phone" type="tel" required />
        <Field label={label.eventDate} name="event_date" type="date" required />
        <Field label={label.eventLocation} name="event_location" required />
        <label className="field">
          {label.serviceType}
          <select name="service_type" required>
            <option value="">Select a service</option>
            {C.bridalServices.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </label>
      </div>
      <TextArea label={label.details} name="details" required />
      <SubmitState status={status} feedback={feedback} />
      {status !== "success" && (
        <button className="btn" type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Sending..." : "Request bridal proposal"}
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
  const [status, setStatus] = useState<FormStatus>("idle");
  const [feedback, setFeedback] = useState<SubmitFeedback | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("loading");
    setFeedback(feedbackCopy.booking.loading);

    try {
      const result = await submitJson("/api/booking", {
        ...formDataToObject(form),
        service_slug: service.slug,
        requested_service: service.name,
        requested_start: slot.start_iso,
        requested_end: slot.end_iso,
        time_zone: slot.time_zone,
      });
      form.reset();
      setFeedback(successFeedback(result, feedbackCopy.booking.success));
      setStatus("success");
      onSuccess();
    } catch (requestError) {
      setFeedback(
        errorFeedback(
          requestError,
          feedbackCopy.booking.errorTitle,
          "We could not send your booking request right now.",
        ),
      );
      setStatus("error");
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="summary">
        {service.name} · {formatDuration(service.duration_minutes)}
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
            <Field label={label.name} name="name" required />
            <Field label={label.email} name="email" type="email" required />
            <Field label={label.phone} name="phone" type="tel" required />
          </div>
          <TextArea label={label.notes} name="notes" />
        </>
      )}
      <SubmitState status={status} feedback={feedback} />
      {status === "success" ? (
        <button className="textlink" onClick={onStartOver} type="button">
          Start another appointment request
          <ArrowRight size={16} />
        </button>
      ) : (
        <button className="btn" type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Sending..." : C.copy.submit}
          <ArrowRight size={16} />
        </button>
      )}
    </form>
  );
}

function Booking() {
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
  const titles = [
    "Select your service",
    "Choose a date",
    "Choose your time",
    "A little about you",
  ];

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
          Let's create
          <br />
          <em>something beautiful.</em>
        </h2>
        <p>
          Choose a service and the website checks Miriã's live calendar before
          sending a pending appointment for confirmation.
        </p>
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
        <span className="eyebrow">STEP {Math.min(step + 1, 4)} / 4</span>
        <h3>{titles[step]}</h3>
        {loadError && (
          <p className="formmessage error" role="alert">
            {loadError}
          </p>
        )}
        {step === 0 && (
          <div className="options">
            {servicesLoading && <p>Loading services...</p>}
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
                  {item.name}
                  <small>
                    {formatDuration(item.duration_minutes)} ·{" "}
                    {item.location_type === "ask_invitee"
                      ? "details confirmed after request"
                      : "in-person"}
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
                {selectedService.name} is estimated at{" "}
                {formatDuration(selectedService.duration_minutes)}. Available
                times are filtered by service length.
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
            {availabilityLoading && <p>Checking available times...</p>}
            {!availabilityLoading && selectedDate && (
              <p className="note">
                {availability.length
                  ? `Available times for ${new Date(
                      `${selectedDate}T12:00:00`,
                    ).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                    })}.`
                  : "No available times for this date. Please go back and choose another day."}
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
                  <small>until {item.end_label}</small>
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
                {C.copy.back}
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
                {C.copy.next}
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
        {(short ? categories.slice(0, 5) : categories).map((category) => (
          <button
            key={category}
            className={filter === category ? "active" : ""}
            onClick={() => {
              setFilter(category);
              setIndex(null);
            }}
            type="button"
          >
            {category}
          </button>
        ))}
      </div>
      <div className="masonry">
        {filtered.map((item, itemIndex) => (
          <button
            key={item.id}
            className="galleryitem"
            onClick={() => setIndex(itemIndex)}
            aria-label={`View ${item.category} look`}
            type="button"
          >
            <Photo id={item.id} alt={`${item.category} by Miriã Cotrim`} />
            <span>
              {item.category}
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
          <DialogTitle>{index !== null ? filtered[index]?.category : ""}</DialogTitle>
          <DialogDescription>Hair artistry by Miriã Cotrim</DialogDescription>
          {index !== null && (
            <img src={photo(filtered[index].id)} alt={filtered[index].category} />
          )}
          <div className="lightnav">
            <button aria-label="Previous photo" onClick={() => move(-1)} type="button">
              <ChevronLeft />
              Previous
            </button>
            <span>
              {(index ?? 0) + 1} / {filtered.length}
            </span>
            <button aria-label="Next photo" onClick={() => move(1)} type="button">
              Next
              <ChevronRight />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ServiceCards() {
  return (
    <div className="servicegrid">
      {C.services.map((service, index) => (
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
          aria-label="Bridal and celebration inspiration film"
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
        <span className="eyebrow">{C.copy.eyebrow}</span>
        <h1
          dangerouslySetInnerHTML={{
            __html: `${C.copy.hero} <em>${C.copy.heroEm}</em> ${C.copy.heroEnd}`,
          }}
        />
        <p>{C.copy.heroSub}</p>
        <div className="heroactions">
          <ButtonLink
            href="/book"
            onClick={(event) => onNavigate(event, "/book")}
          >
            {C.copy.book}
          </ButtonLink>
          <Link
            className="textlink"
            href="/bridal"
            onClick={(event) => onNavigate(event, "/bridal")}
            scroll={false}
          >
            {C.copy.explore}
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
            Inspiration film · Licensed footage
          </button>
          <button
            className="film-toggle"
            onClick={toggleVideo}
            type="button"
            aria-label={paused ? "Play film" : "Pause film"}
          >
            {paused ? "▶ Play film" : "Ⅱ Pause film"}
          </button>
        </div>
      </div>
    </section>
  );
}

function About({ full = false }: { full?: boolean }) {
  return (
    <section className="about section">
      <div className="portrait">
        <Photo id={5} alt="Miriã Cotrim, beauty artist" />
        <span className="portraitcaption">THE ARTIST BEHIND YOUR BEAUTY</span>
      </div>
      <div>
        <span className="eyebrow">PERSONAL BEAUTY. PURPOSEFUL ARTISTRY.</span>
        <h2>
          {C.copy.about}
          <span className="serifitalic">
            An eye for detail.
            <br />A heart for your story.
          </span>
        </h2>
        <p>{C.professional.bio}</p>
        <p className="roles">
          Bridal Beauty Artist · Hair Specialist
          <br />
          Makeup Artist · Event Beauty
        </p>
        {!full ? (
          <ButtonLink href="/about">Discover her story</ButtonLink>
        ) : (
          <ButtonLink href="/book">Let's meet</ButtonLink>
        )}
      </div>
    </section>
  );
}

function Bridal({ full = false }: { full?: boolean }) {
  return (
    <section className="bridalfeature">
      <div className="bridalphoto">
        <Photo id={27} />
        <span>YOUR DAY. YOUR BEAUTY. YOUR MOMENT.</span>
      </div>
      <div className="bridaltext">
        <span className="eyebrow">BEAUTIFUL FROM THE FIRST MOMENT</span>
        <h2>
          The bridal
          <br />
          <em>experience.</em>
        </h2>
        <p>
          From the first conversation to the final finishing touch. Hair and
          makeup that reflect who you are, for a day that is entirely yours.
        </p>
        <div className="bridalservices">
          {C.bridalServices.slice(0, full ? 9 : 6).map((service) => (
            <span key={service}>{service}</span>
          ))}
        </div>
        <ButtonLink href={full ? "#bridal-inquiry" : "/bridal"} light>
          Request your bridal consultation
        </ButtonLink>
      </div>
    </section>
  );
}

export default function Site({ page }: { page: string }) {
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [notice, setNotice] = useState("");
  const [language, setLanguage] = useState("EN");
  const home = page === "home";
  const contactEmail = C.contact.email;
  const whatsappNumber = C.contact.WHATSAPP_NUMBER;
  const visibleNavigation = useMemo(() => C.navigation, []);

  useEffect(() => {
    document.title = home
      ? C.seo.title
      : `${page.charAt(0).toUpperCase() + page.slice(1)} | Miriã Cotrim`;
  }, [home, page]);

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
    ? `https://wa.me/${whatsappNumber}?text=Hello%20Miria%2C%20I%20would%20like%20to%20know%20more%20about%20your%20services.`
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
    <>
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
              showNotice(
                "Language preview: the complete Portuguese translation can be added after final content approval.",
              );
            }}
            type="button"
          >
            {language} <span>⌄</span>
          </button>
          <Link
            href="/book"
            className="navbook"
            onClick={(event) => handleNavigationClick(event, "/book")}
            scroll={false}
          >
            Book now
            <ArrowUpRight size={15} />
          </Link>
          <button
            className="menubtn"
            aria-label="Open menu"
            onClick={() => setMenu(true)}
            type="button"
          >
            <Menu />
          </button>
        </div>
      </header>

      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent className="mobilemenu">
          <SheetTitle>{C.brand.name}</SheetTitle>
          <SheetDescription>{C.brand.tagline}</SheetDescription>
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
          <ButtonLink href="/book">Book now</ButtonLink>
        </SheetContent>
      </Sheet>

      <main>
        {home && (
          <>
            <HeroFilm
              onNavigate={handleNavigationClick}
              onCredit={() =>
                showNotice(
                  "The homepage film uses licensed inspiration footage from Pexels. The people shown are not presented as Miriã's clients.",
                )
              }
            />

            <section className="intro section">
              <span className="eyebrow">A PERSONAL APPROACH TO BEAUTY</span>
              <h2>{C.copy.position}</h2>
              <p>{C.copy.positionText}</p>
            </section>

            <section className="section services">
              <div className="sectionhead">
                <div>
                  <span className="eyebrow">BEAUTY, IN EVERY CHAPTER</span>
                  <h2>
                    Created around <em>you.</em>
                  </h2>
                </div>
                <Link className="textlink" href="/services">
                  Explore services
                  <ArrowUpRight size={16} />
                </Link>
              </div>
              <ServiceCards />
            </section>

            <Bridal />

            <section className="section">
              <div className="sectionhead">
                <div>
                  <span className="eyebrow">SELECTED WORK</span>
                  <h2>{C.copy.portfolio}</h2>
                </div>
                <Link href="/portfolio" className="textlink">
                  View the portfolio
                  <ArrowUpRight size={16} />
                </Link>
              </div>
              <Gallery short />
            </section>

            <About />

            <section className="section signatures">
              <span className="eyebrow">THE DETAILS MAKE THE DIFFERENCE</span>
              <h2>{C.copy.signature}</h2>
              <div className="signaturegrid">
                {[
                  [53, "Romantic Updo"],
                  [21, "Hollywood Waves"],
                  [39, "Modern Bridal Bun"],
                  [15, "Soft Half-Up"],
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
                <span className="eyebrow">START WITH A CONVERSATION</span>
                <h2>Plan your beauty experience.</h2>
                <p>
                  Tell us about your wedding, celebration or appointment and
                  Miriã's team will follow up with the next step.
                </p>
              </div>
              <ContactForm source="home_cta" />
            </section>

            <section className="clientlove section">
              <span className="eyebrow">WORDS TO REMEMBER</span>
              <h2>{C.copy.clientLove}</h2>
              <div className="quotes">
                {[1, 2, 3].map((item) => (
                  <div key={item}>
                    <span>“</span>
                    <p>{C.copy.testimonial}</p>
                    <small>Awaiting approved client stories</small>
                  </div>
                ))}
              </div>
            </section>

            <section className="section social">
              <div className="sectionhead">
                <h2>Follow the beauty.</h2>
                <a
                  href={C.socialMedia.Instagram}
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
                  <a href={C.socialMedia.Instagram} key={id} target="_blank" rel="noreferrer">
                    <Photo id={id} />
                  </a>
                ))}
              </div>
            </section>
          </>
        )}

        {!home && page !== "book" && (
          <section className="pagetitle">
            <span className="eyebrow">MIRIÃ COTRIM · BRIDAL BEAUTY</span>
            <h1>{pageTitles[page]}</h1>
          </section>
        )}

        {page === "about" && (
          <>
            <About full />
            <section className="section">
              <span className="eyebrow">THE CARE BEHIND EVERY LOOK</span>
              <h2>{C.copy.behind}</h2>
              <div className="behindgrid">
                {[
                  [31, "Consultation"],
                  [30, "Preparation"],
                  [32, "Styling"],
                  [23, "Finishing touches"],
                  [53, "Final look"],
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
              <h2>Special events</h2>
              <p>
                Personalized hair and makeup for birthdays, celebrations,
                photoshoots and the moments worth remembering.
              </p>
              <ButtonLink href="/book">Plan your event look</ButtonLink>
            </div>
            <div className="service-detail" id="hair">
              <h2>Hair, thoughtfully cared for.</h2>
              <p>
                Explore cuts, styling, treatments and transformations in a
                personal consultation.
              </p>
              <ButtonLink href="/book">Explore an appointment</ButtonLink>
            </div>
          </section>
        )}

        {page === "bridal" && (
          <>
            <Bridal full />
            <section className="section bridalform" id="bridal-inquiry">
              <div>
                <span className="eyebrow">TELL US ABOUT YOUR DAY</span>
                <h2>
                  Plan your bridal
                  <br />
                  <em>beauty experience.</em>
                </h2>
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
              <h2>
                Your story starts
                <br />
                <em>with a conversation.</em>
              </h2>
              <p>
                Bridal beauty, a special occasion, a fresh look or a custom
                event request. Send a message and Miriã's team will respond.
              </p>
              <ButtonLink href="/book">Explore appointments</ButtonLink>
              <a
                href={C.socialMedia.Instagram}
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
            <span>{C.brand.name}</span>
            <small>BRIDAL BEAUTY</small>
            <p>
              Personal beauty.
              <br />
              Unforgettable moments.
            </p>
          </div>
          <div>
            <span className="eyebrow">EXPLORE</span>
            {visibleNavigation.slice(1).map(([name, href]) => (
              <Link key={name} href={href}>
                {name}
              </Link>
            ))}
          </div>
          <div>
            <span className="eyebrow">LET'S CONNECT</span>
            <Link href="/contact">Contact</Link>
            {Object.entries(C.socialMedia).map(([name, url]) =>
              url ? (
                <a key={name} href={url} target="_blank" rel="noreferrer">
                  {name}
                </a>
              ) : null,
            )}
            {contactEmail && <a href={`mailto:${contactEmail}`}>Email</a>}
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            )}
          </div>
          <div className="newsletter">
            <h3>Join our Beauty List</h3>
            <NewsletterForm />
          </div>
        </div>
        <div className="footerbottom">
          <span>
            © {new Date().getFullYear()} Miriã Cotrim Bridal Beauty
          </span>
          <span>{C.brand.version}</span>
          <div>
            {["Privacy Policy", "Terms", "Cancellation Policy"].map((item) => (
              <button
                key={item}
                onClick={() =>
                  showNotice(
                    `${item}: final policies should be reviewed and published before launch.`,
                  )
                }
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </footer>

      <button
        className="whatsapp"
        aria-label="Talk to Miriã on WhatsApp"
        onClick={() =>
          whatsappUrl
            ? window.open(whatsappUrl, "_blank")
            : showNotice(
                "Add Miriã's official WhatsApp number in app/siteContent.ts before launch.",
              )
        }
        type="button"
      >
        <MessageCircle size={22} />
        <span>Talk to Miriã</span>
      </button>

      <Dialog open={!!notice} onOpenChange={(open) => !open && setNotice("")}>
        <DialogContent>
          <DialogTitle>Miriã Cotrim Bridal Beauty</DialogTitle>
          <DialogDescription>{notice}</DialogDescription>
          <button className="btn" onClick={() => setNotice("")} type="button">
            Got it
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
