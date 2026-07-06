type PropsType = {children: React.ReactNode};

export function TypographyH1({
	children
}: PropsType) {
  return (
    <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
      {children}
    </h1>
  )
}
