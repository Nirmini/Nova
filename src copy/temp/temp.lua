local Reader = script.Parent
local Audio_Accept = script.Parent.Mesh["Keycard Accepted"]
local Audio_Deny = script.Parent.Mesh["Keycard Denied"]
local CardMdl = script.Parent.ReplicaKey
local Rdr_Stat = Reader.Light
local Rdr_Main = Reader.Mesh
local TweenService = game:GetService("TweenService")
local AcptdEvnt = script.Parent.Accepted
local cardConfig = ""
local Debounce = false
local Ptwn = require(game.ServerScriptService.Game.PioTweenServer)
local Post = CardMdl.PrimaryPart.CFrame - Vector3.new(0,0.6,0) -- Part Offset
local AltPost = CardMdl.PrimaryPart.CFrame - Vector3.new(0,-0.3,0) -- Part Offset

local function CardHide()
	for _, part in ipairs(CardMdl:GetDescendants()) do
		if part:IsA("MeshPart") then part.Transparency = 1 end
		if part:IsA("BasePart") then 
			if part.Name == "Chip" then part.Decal.Transparency = 1 end
			if part.Name == "InvisDte" then part.SurfaceGui.TextLabel.Visible = false end
			if part.Name == "InvisAcss" then part.SurfaceGui.TextLabel.Visible = false end
			if part.Name == "InvisLvl" then part.SurfaceGui.TextLabel.Visible = false end
		end
	end
end

local function CardShow()
	for _, part in ipairs(CardMdl:GetDescendants()) do
		if part:IsA("MeshPart") then part.Transparency = 0 end
		if part:IsA("BasePart") then 
			if part.Name == "Chip" then part.Decal.Transparency = 0 end
			if part.Name == "InvisDte" then part.SurfaceGui.TextLabel.Visible = true end
			if part.Name == "InvisAcss" then part.SurfaceGui.TextLabel.Visible = true end
			if part.Name == "InvisLvl" then part.SurfaceGui.TextLabel.Visible = true end
		end
	end
end

local endSignal = Instance.new("BindableEvent")
local function MoveCardDown()
	Ptwn:TweenModel(script.Parent.ReplicaKey, Post, 1.5, Enum.EasingStyle.Sine)
end

local endSignal = Instance.new("BindableEvent")
local function MoveCardUp()
	Ptwn:TweenModel(script.Parent.ReplicaKey, AltPost, 1.5, Enum.EasingStyle.Sine)
end

local function MainFunc(touchPart)
	local character = touchPart.Parent
	local player = game.Players:GetPlayerFromCharacter(character)
	if player then
		local heldItem = character:FindFirstChildWhichIsA("Tool")
		if heldItem then
			if heldItem.Name == "Employee Keycard" then
				cardConfig = "Employee"
			elseif heldItem.Name == "Security Keycard" then
				cardConfig = "Security"
			elseif heldItem.Name == "Maintenance Keycard" then
				cardConfig = "Maintenance"
			elseif heldItem.Name == "Administration Keycard" then
				cardConfig = "Administration"
			else
				return
			end
			if Debounce == false then
				Debounce = true
				if cardConfig == "Employee" then
					CardMdl.Colour.Color = Color3.fromRGB(239, 184, 56)
					CardMdl.InvisLvl.SurfaceGui.TextLabel.Text = "Level E"
					CardMdl.InvisAcss.SurfaceGui.TextLabel.Text = "Employee Access"
				elseif cardConfig == "Maintenance" then
					CardMdl.Colour.Color = Color3.fromRGB(190, 104, 98)
					CardMdl.InvisLvl.SurfaceGui.TextLabel.Text = "Level D"
					CardMdl.InvisAcss.SurfaceGui.TextLabel.Text = "Maintenance Access"
				elseif cardConfig == "Security" then
					CardMdl.Colour.Color = Color3.fromRGB(42, 74, 108)
					CardMdl.InvisLvl.SurfaceGui.TextLabel.Text = "Level B"
					CardMdl.InvisAcss.SurfaceGui.TextLabel.Text = "Security Access"
				elseif cardConfig == "Administration" then
					CardMdl.Colour.Color = Color3.fromRGB(17, 17, 17)
					CardMdl.InvisLvl.SurfaceGui.TextLabel.Text = "Level A"
					CardMdl.InvisAcss.SurfaceGui.TextLabel.Text = "Administrator Access"
				end
				CardShow()
				MoveCardDown()
				wait(1.5)
				if cardConfig == "Employee" or cardConfig == "Security" or cardConfig == "Administration" then
					Audio_Accept:Play()
					wait(0.3)
					Rdr_Stat.BrickColor = BrickColor.new("Lime green")
					AcptdEvnt:Fire()
					wait(0.25)
					MoveCardUp()
					Rdr_Stat.BrickColor = BrickColor.new("Really black")
					wait(1)
					CardHide()
					cardConfig = ""
					wait(2)
				else
					Audio_Deny:Play()
					wait(0.3)
					Rdr_Stat.BrickColor = BrickColor.new("Really red")
					wait(0.25)
					MoveCardUp()
					Rdr_Stat.BrickColor = BrickColor.new("Really black")
					wait(1)
					CardHide()
					cardConfig = ""
					wait(2)
				end
				Debounce = false
			end
		end
	end
end

Rdr_Main.Touched:Connect(MainFunc)
