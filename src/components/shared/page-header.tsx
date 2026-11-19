type PageHeaderProps = {
  title: string;
  description?: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="flex min-w-0 flex-col gap-1">
      <h1 className="text-title text-balance wrap-anywhere">{title}</h1>
      {description ? <p className="text-body-lg text-muted-foreground">{description}</p> : null}
    </header>
  );
}
